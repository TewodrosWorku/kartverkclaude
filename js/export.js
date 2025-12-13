/**
 * Export Module
 * Handles map export to PNG with scale bar
 * @module export
 */

import { getMap } from './map-manager.js';
import { hideForExport as hideMarkers, showAfterExport as showMarkers } from './distance-markers.js';

/**
 * Export map as PNG image
 * @param {string} filename - Optional custom filename
 */
export async function exportMapImage(filename = null) {
    try {
        // Generate filename
        const projectName = filename || 'avplan';
        const date = new Date().toISOString().split('T')[0];
        const finalFilename = `${projectName}_${date}.png`;

        // Show loading indicator
        const loadingIndicator = showLoadingIndicator('Eksporterer kart...');

        // Prepare map for export
        prepareMapForExport();

        // Create and add scale bar
        const scaleBar = createScaleBar();
        document.getElementById('map').appendChild(scaleBar);

        // Wait a moment for changes to render
        await new Promise(resolve => setTimeout(resolve, 500));

        // Capture map
        const canvas = await captureMapImage();

        if (!canvas) {
            throw new Error('Failed to capture map image');
        }

        // Download image
        downloadCanvas(canvas, finalFilename);

        // Restore map
        restoreMapAfterExport();

        // Remove scale bar
        if (scaleBar && scaleBar.parentNode) {
            scaleBar.parentNode.removeChild(scaleBar);
        }

        // Hide loading indicator
        hideLoadingIndicator(loadingIndicator);

        console.log(`Map exported as ${finalFilename}`);

        // Update status
        const statusText = document.getElementById('statusText');
        if (statusText) {
            statusText.textContent = 'Kart eksportert';
        }

    } catch (error) {
        console.error('Export failed:', error);
        alert('Eksport feilet. Prøv igjen.');

        // Ensure map is restored even on error
        restoreMapAfterExport();
    }
}

/**
 * Prepare map for export (hide UI elements)
 */
function prepareMapForExport() {
    // Hide sidebar
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.style.display = 'none';
    }

    // Hide status bar
    const statusBar = document.getElementById('statusBar');
    if (statusBar) {
        statusBar.style.display = 'none';
    }

    // Hide Leaflet controls
    const controls = document.querySelectorAll('.leaflet-control');
    controls.forEach(control => {
        control.style.display = 'none';
    });

    // Hide distance markers (make transparent, don't remove)
    hideMarkers();

    console.log('Map prepared for export');
}

/**
 * Restore map after export (show UI elements)
 */
function restoreMapAfterExport() {
    // Show sidebar
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.style.display = '';
    }

    // Show status bar
    const statusBar = document.getElementById('statusBar');
    if (statusBar) {
        statusBar.style.display = '';
    }

    // Show Leaflet controls
    const controls = document.querySelectorAll('.leaflet-control');
    controls.forEach(control => {
        control.style.display = '';
    });

    // Show distance markers
    showMarkers();

    console.log('Map restored after export');
}

/**
 * Create scale bar element
 * @returns {HTMLElement} Scale bar element
 */
function createScaleBar() {
    const map = getMap();
    if (!map) {
        console.error('Map not available');
        return null;
    }

    // Get map info
    const zoom = map.getZoom();
    const center = map.getCenter();

    // Calculate meters per pixel
    const metersPerPixel = 156543.03392 * Math.cos(center.lat * Math.PI / 180) / Math.pow(2, zoom);

    // Target width: 200 pixels
    const targetPixels = 200;
    let scaleDistance = metersPerPixel * targetPixels;

    // Round to nice number
    scaleDistance = roundToNiceNumber(scaleDistance);

    // Adjust pixel width to match rounded distance
    const actualPixels = scaleDistance / metersPerPixel;

    // Create scale bar container
    const scaleBar = document.createElement('div');
    scaleBar.className = 'export-scale-bar';

    // Create segments container
    const segmentsContainer = document.createElement('div');
    segmentsContainer.className = 'scale-bar-segments';
    segmentsContainer.style.cssText = `
        display: flex;
        height: 10px;
        width: ${actualPixels}px;
        margin-bottom: 5px;
    `;

    // Create alternating segments (every 10m or appropriate interval)
    const segmentDistance = scaleDistance / 10; // 10 segments
    for (let i = 0; i < 10; i++) {
        const segment = document.createElement('div');
        segment.className = i % 2 === 0 ? 'scale-bar-segment dark' : 'scale-bar-segment light';
        segment.style.flex = '1';
        segment.style.border = '1px solid #333';
        segment.style.backgroundColor = i % 2 === 0 ? '#333' : '#fff';
        segmentsContainer.appendChild(segment);
    }

    scaleBar.appendChild(segmentsContainer);

    // Create label
    const label = document.createElement('div');
    label.className = 'scale-bar-label';
    label.textContent = `${scaleDistance} m`;
    label.style.textAlign = 'center';
    scaleBar.appendChild(label);

    console.log(`Scale bar created: ${scaleDistance}m = ${actualPixels.toFixed(0)}px`);
    return scaleBar;
}

/**
 * Round value to nice number for scale bar
 * @param {number} value - Value to round
 * @returns {number} Rounded value
 */
function roundToNiceNumber(value) {
    // Get magnitude
    const magnitude = Math.pow(10, Math.floor(Math.log10(value)));

    // Normalize
    const normalized = value / magnitude;

    // Round to nice values: 1, 2, 5, 10
    let nice;
    if (normalized <= 1) {
        nice = 1;
    } else if (normalized <= 2) {
        nice = 2;
    } else if (normalized <= 5) {
        nice = 5;
    } else {
        nice = 10;
    }

    const result = nice * magnitude;

    // Ensure result is in common scale bar increments
    const commonValues = [50, 100, 200, 500, 1000, 2000, 5000, 10000];
    for (const val of commonValues) {
        if (Math.abs(result - val) < val * 0.3) {
            return val;
        }
    }

    return result;
}

/**
 * Capture map as canvas using html2canvas
 * @returns {Promise<HTMLCanvasElement>} Canvas element
 */
async function captureMapImage() {
    const mapElement = document.getElementById('map');

    if (!mapElement) {
        console.error('Map element not found');
        return null;
    }

    try {
        const canvas = await html2canvas(mapElement, {
            scale: 2, // 2x resolution for print quality
            useCORS: true, // Allow external images
            backgroundColor: '#ffffff',
            logging: false,
            windowWidth: mapElement.offsetWidth,
            windowHeight: mapElement.offsetHeight,
            ignoreElements: (element) => {
                // Ignore elements with specific classes
                return element.classList.contains('leaflet-control-container');
            }
        });

        console.log('Map captured successfully');
        return canvas;

    } catch (error) {
        console.error('Error capturing map:', error);
        return null;
    }
}

/**
 * Download canvas as PNG file
 * @param {HTMLCanvasElement} canvas - Canvas to download
 * @param {string} filename - Filename for download
 */
function downloadCanvas(canvas, filename) {
    try {
        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/png');

        // Create temporary link
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;

        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log(`Downloaded: ${filename}`);

    } catch (error) {
        console.error('Error downloading canvas:', error);
        throw error;
    }
}

/**
 * Show loading indicator
 * @param {string} message - Loading message
 * @returns {HTMLElement} Loading indicator element
 */
function showLoadingIndicator(message = 'Laster...') {
    const indicator = document.createElement('div');
    indicator.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        color: white;
    `;

    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    indicator.appendChild(spinner);

    const text = document.createElement('p');
    text.textContent = message;
    text.style.marginTop = '20px';
    text.style.fontSize = '16px';
    indicator.appendChild(text);

    document.body.appendChild(indicator);

    return indicator;
}

/**
 * Hide loading indicator
 * @param {HTMLElement} indicator - Loading indicator element
 */
function hideLoadingIndicator(indicator) {
    if (indicator && indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
    }
}

export default {
    exportMapImage
};
