/**
 * Text Box Manager Module
 * Handles placement, dragging, resizing, and editing of text boxes on the map
 * @module textbox-manager
 */

export class TextBoxManager {
    constructor(map) {
        this.map = map;
        this.textBoxes = [];
        this.placementMode = false;
        this.currentTextBoxType = null; // 'white' or 'yellow'
        this.textBoxCounter = 0;

        this.initializeUI();
    }

    /**
     * Initialize UI event listeners
     */
    initializeUI() {
        const whiteBtn = document.getElementById('whiteTextboxBtn');
        const yellowBtn = document.getElementById('yellowTextboxBtn');

        if (whiteBtn) {
            whiteBtn.addEventListener('click', () => this.startPlacement('white'));
        }

        if (yellowBtn) {
            yellowBtn.addEventListener('click', () => this.startPlacement('yellow'));
        }

        // Update counter display
        this.updateCounter();
    }

    /**
     * Start text box placement mode
     * @param {string} type - 'white' or 'yellow'
     */
    startPlacement(type) {
        this.placementMode = true;
        this.currentTextBoxType = type;

        // Change cursor to indicate placement mode
        this.map.getContainer().style.cursor = 'crosshair';

        // Update status
        const statusText = document.getElementById('statusText');
        if (statusText) {
            statusText.textContent = `Klikk på kartet for å plassere ${type === 'white' ? 'hvit' : 'gul'} tekstboks`;
        }

        // Add one-time click listener for placement
        this.map.once('click', (e) => this.placeTextBox(e.latlng));
    }

    /**
     * Place a text box on the map
     * @param {L.LatLng} latlng - Position to place text box
     */
    placeTextBox(latlng) {
        if (!this.placementMode) return;

        const textBoxId = `textbox_${Date.now()}_${this.textBoxCounter++}`;
        const backgroundColor = this.currentTextBoxType === 'white' ? '#fff' : '#C0D81D';
        const defaultText = 'Dobbeltklikk for å redigere';

        // Create text box HTML
        const textBoxHTML = `
            <div class="textbox-container" data-textbox-id="${textBoxId}" style="
                background-color: ${backgroundColor};
                color: #000;
                border: 2px solid #000;
                border-radius: 4px;
                padding: 0px 8px 6px 8px;
                font-size: 16px;
                font-family: Arial, sans-serif;
                min-width: 150px;
                max-width: 400px;
                min-height: 30px;
                white-space: pre-wrap;
                word-wrap: break-word;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                cursor: move;
                resize: both;
                overflow: hidden;
                line-height: 1.4;
            ">
                <div class="textbox-content" style="pointer-events: none;">
                    ${defaultText}
                </div>
                <div class="resize-handle" style="
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    width: 16px;
                    height: 16px;
                    cursor: se-resize;
                    pointer-events: all;
                "></div>
            </div>
        `;

        // Create Leaflet marker with divIcon
        const textBoxMarker = L.marker(latlng, {
            icon: L.divIcon({
                className: 'textbox-marker',
                html: textBoxHTML,
                iconSize: [150, 40],
                iconAnchor: [75, 20]
            }),
            draggable: true,
            autoPan: true
        });

        // Add to map
        textBoxMarker.addTo(this.map);

        // Store text box data
        const textBoxData = {
            id: textBoxId,
            marker: textBoxMarker,
            latlng: latlng,
            type: this.currentTextBoxType,
            text: defaultText,
            width: 150,
            height: 40
        };

        this.textBoxes.push(textBoxData);

        // Add double-click event for editing
        setTimeout(() => {
            const container = document.querySelector(`[data-textbox-id="${textBoxId}"]`);
            if (container) {
                container.addEventListener('dblclick', (e) => {
                    e.stopPropagation();
                    this.editTextBox(textBoxId);
                });

                // Handle drag events to update position
                textBoxMarker.on('dragend', () => {
                    textBoxData.latlng = textBoxMarker.getLatLng();
                });
            }
        }, 100);

        // Reset placement mode
        this.placementMode = false;
        this.currentTextBoxType = null;
        this.map.getContainer().style.cursor = '';

        // Update status
        const statusText = document.getElementById('statusText');
        if (statusText) {
            statusText.textContent = 'Klar';
        }

        // Update counter
        this.updateCounter();

        console.log('✓ Text box placed:', textBoxId);
    }

    /**
     * Edit text box content
     * @param {string} textBoxId - ID of text box to edit
     */
    editTextBox(textBoxId) {
        const textBoxData = this.textBoxes.find(tb => tb.id === textBoxId);
        if (!textBoxData) return;

        const currentText = textBoxData.text;

        // Create popup with textarea
        const popupContent = `
            <div style="min-width: 250px;">
                <h3 style="margin-top: 0; font-size: 14px;">Rediger tekstboks</h3>
                <textarea id="textboxEditArea" style="
                    width: 100%;
                    min-height: 100px;
                    padding: 8px;
                    font-size: 14px;
                    font-family: Arial, sans-serif;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    resize: vertical;
                ">${currentText}</textarea>
                <div style="margin-top: 10px; display: flex; gap: 8px;">
                    <button id="saveTextBtn" style="
                        flex: 1;
                        padding: 8px;
                        background-color: #0066cc;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 13px;
                    ">Lagre</button>
                    <button id="deleteTextBoxBtn" style="
                        padding: 8px 12px;
                        background-color: #dc3545;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 13px;
                    ">Slett</button>
                </div>
            </div>
        `;

        // Create and open popup
        const popup = L.popup({
            closeButton: true,
            closeOnClick: false,
            autoClose: false
        })
            .setLatLng(textBoxData.latlng)
            .setContent(popupContent)
            .openOn(this.map);

        // Add event listeners after popup opens
        setTimeout(() => {
            const textarea = document.getElementById('textboxEditArea');
            const saveBtn = document.getElementById('saveTextBtn');
            const deleteBtn = document.getElementById('deleteTextBoxBtn');

            if (textarea) {
                textarea.focus();
                textarea.select();
            }

            if (saveBtn) {
                saveBtn.addEventListener('click', () => {
                    const newText = textarea.value.trim() || 'Dobbeltklikk for å redigere';
                    this.updateTextBoxContent(textBoxId, newText);
                    this.map.closePopup(popup);
                });
            }

            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => {
                    this.deleteTextBox(textBoxId);
                    this.map.closePopup(popup);
                });
            }
        }, 100);
    }

    /**
     * Update text box content
     * @param {string} textBoxId - ID of text box
     * @param {string} newText - New text content
     */
    updateTextBoxContent(textBoxId, newText) {
        const textBoxData = this.textBoxes.find(tb => tb.id === textBoxId);
        if (!textBoxData) return;

        // Update stored text
        textBoxData.text = newText;

        // Update DOM
        const container = document.querySelector(`[data-textbox-id="${textBoxId}"]`);
        if (container) {
            const contentDiv = container.querySelector('.textbox-content');
            if (contentDiv) {
                contentDiv.textContent = newText;
            }
        }

        console.log('✓ Text box updated:', textBoxId);
    }

    /**
     * Delete a text box
     * @param {string} textBoxId - ID of text box to delete
     */
    deleteTextBox(textBoxId) {
        const index = this.textBoxes.findIndex(tb => tb.id === textBoxId);
        if (index === -1) return;

        const textBoxData = this.textBoxes[index];

        // Remove marker from map
        if (textBoxData.marker) {
            this.map.removeLayer(textBoxData.marker);
        }

        // Remove from array
        this.textBoxes.splice(index, 1);

        // Update counter
        this.updateCounter();

        console.log('✓ Text box deleted:', textBoxId);
    }

    /**
     * Update text box counter display
     */
    updateCounter() {
        const countElement = document.getElementById('textboxCount');
        if (countElement) {
            countElement.textContent = this.textBoxes.length;
        }
    }

    /**
     * Get all text boxes data for saving
     * @returns {Array} Array of text box data objects
     */
    getTextBoxesData() {
        return this.textBoxes.map(tb => ({
            id: tb.id,
            latlng: {
                lat: tb.latlng.lat,
                lng: tb.latlng.lng
            },
            type: tb.type,
            text: tb.text,
            width: tb.width,
            height: tb.height
        }));
    }

    /**
     * Load text boxes from saved data
     * @param {Array} textBoxesData - Array of text box data objects
     */
    loadTextBoxes(textBoxesData) {
        if (!Array.isArray(textBoxesData)) return;

        // Clear existing text boxes
        this.clearAllTextBoxes();

        // Load each text box
        textBoxesData.forEach((data, index) => {
            const latlng = L.latLng(data.latlng.lat, data.latlng.lng);

            // Set type and enable placement mode
            this.currentTextBoxType = data.type;
            this.placementMode = true;

            // Place the text box
            this.placeTextBox(latlng);

            // Get the most recently placed text box (last in array)
            const placedTextBox = this.textBoxes[this.textBoxes.length - 1];

            // Update text content if different from default
            if (data.text && placedTextBox) {
                setTimeout(() => {
                    this.updateTextBoxContent(placedTextBox.id, data.text);
                }, 50 * (index + 1)); // Stagger updates to avoid race conditions
            }
        });

        console.log(`✓ Loaded ${textBoxesData.length} text boxes`);
    }

    /**
     * Clear all text boxes from map
     */
    clearAllTextBoxes() {
        this.textBoxes.forEach(tb => {
            if (tb.marker) {
                this.map.removeLayer(tb.marker);
            }
        });
        this.textBoxes = [];
        this.updateCounter();
    }

    /**
     * Get text box count
     * @returns {number} Number of text boxes
     */
    getTextBoxCount() {
        return this.textBoxes.length;
    }
}

export default TextBoxManager;
