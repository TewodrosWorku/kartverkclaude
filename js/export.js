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
    let inlinedSigns = null;

    try {
        // Generate filename
        const projectName = filename || 'avplan';
        const date = new Date().toISOString().split('T')[0];
        const finalFilename = `${projectName}_${date}.png`;

        // Show loading indicator
        const loadingIndicator = showLoadingIndicator('Eksporterer kart...');

        // Prepare map for export
        prepareMapForExport();

        // Inline SVG signs to avoid CORS issues
        inlinedSigns = await inlineSignSVGs();

        // Create and add scale bar
        const scaleBar = createScaleBar();
        document.getElementById('map').appendChild(scaleBar);

        // Wait a moment for changes to render
        await new Promise(resolve => setTimeout(resolve, 500));

        // Capture map
        console.log('Starting map capture...');
        const canvas = await captureMapImage();

        if (!canvas) {
            console.error('Canvas is null - html2canvas failed');
            throw new Error('Failed to capture map image');
        }

        console.log('Canvas created successfully:', canvas.width, 'x', canvas.height);

        // Download image
        console.log('Starting download...');
        await downloadCanvas(canvas, finalFilename);
        console.log('Download completed');

        // Restore map
        restoreMapAfterExport();

        // Restore sign images
        restoreSignImages(inlinedSigns);

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

        // Restore sign images if they were inlined
        if (inlinedSigns) {
            restoreSignImages(inlinedSigns);
        }
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

    // Hide road layer (blue line) during export
    const map = getMap();
    if (map && map.eachLayer) {
        map.eachLayer(layer => {
            // Hide road polyline layers (blue line showing selected road)
            if (layer instanceof L.GeoJSON || layer instanceof L.Polyline) {
                if (layer.options && layer.options.color === '#0066cc') {
                    layer.setStyle({ opacity: 0, fillOpacity: 0 });
                }
            }
            // Also hide distance labels on the road
            if (layer instanceof L.Marker && layer.options.icon && layer.options.icon.options.className === 'distance-label') {
                const icon = layer.getElement();
                if (icon) icon.style.display = 'none';
            }
        });
    }

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

    // Restore road layer (blue line) visibility
    const map = getMap();
    if (map && map.eachLayer) {
        map.eachLayer(layer => {
            // Restore road polyline layers
            if (layer instanceof L.GeoJSON || layer instanceof L.Polyline) {
                if (layer.options && layer.options.color === '#0066cc') {
                    layer.setStyle({ opacity: 0.7, fillOpacity: 0.7 });
                }
            }
            // Restore distance labels on the road
            if (layer instanceof L.Marker && layer.options.icon && layer.options.icon.options.className === 'distance-label') {
                const icon = layer.getElement();
                if (icon) icon.style.display = '';
            }
        });
    }

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
 * Inline all SVG sign images to avoid CORS taint issues during export
 * @returns {Promise<Array>} Array of replaced elements for restoration
 */
async function inlineSignSVGs() {
    const inlinedSigns = [];

    try {
        // Find all traffic sign images in the map
        const signImages = document.querySelectorAll('.leaflet-marker-icon img');

        console.log(`Found ${signImages.length} sign images to inline`);

        for (const img of signImages) {
            const src = img.getAttribute('src');
            if (!src || !src.includes('.svg')) {
                continue; // Skip non-SVG images
            }

            try {
                // Fetch SVG content
                const response = await fetch(src);
                if (!response.ok) {
                    console.warn(`Failed to fetch SVG: ${src}`);
                    continue;
                }

                const svgText = await response.text();

                // Parse SVG
                const parser = new DOMParser();
                const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
                const svgElement = svgDoc.documentElement;

                if (svgElement.tagName !== 'svg') {
                    console.warn(`Invalid SVG content: ${src}`);
                    continue;
                }

                // Copy img styles to SVG
                const computedStyle = window.getComputedStyle(img);
                svgElement.style.width = computedStyle.width;
                svgElement.style.height = computedStyle.height;
                svgElement.style.transform = computedStyle.transform;
                svgElement.style.transformOrigin = computedStyle.transformOrigin;
                svgElement.style.position = 'absolute';
                svgElement.style.pointerEvents = 'none';

                // Store original for restoration
                const parent = img.parentElement;
                const nextSibling = img.nextSibling;

                inlinedSigns.push({
                    originalImg: img,
                    inlinedSvg: svgElement,
                    parent: parent,
                    nextSibling: nextSibling
                });

                // Replace img with inline SVG
                parent.replaceChild(svgElement, img);

            } catch (err) {
                console.warn(`Error inlining SVG ${src}:`, err);
            }
        }

        console.log(`Successfully inlined ${inlinedSigns.length} sign SVGs`);

    } catch (error) {
        console.error('Error during SVG inlining:', error);
    }

    return inlinedSigns;
}

/**
 * Restore original img elements after export
 * @param {Array} inlinedSigns - Array from inlineSignSVGs
 */
function restoreSignImages(inlinedSigns) {
    if (!inlinedSigns || inlinedSigns.length === 0) {
        return;
    }

    try {
        for (const item of inlinedSigns) {
            const { originalImg, inlinedSvg, parent, nextSibling } = item;

            if (parent && inlinedSvg && inlinedSvg.parentNode === parent) {
                if (nextSibling) {
                    parent.insertBefore(originalImg, nextSibling);
                } else {
                    parent.appendChild(originalImg);
                }
                parent.removeChild(inlinedSvg);
            }
        }

        console.log(`Restored ${inlinedSigns.length} sign images`);

    } catch (error) {
        console.error('Error restoring sign images:', error);
    }
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

    // Check if html2canvas is loaded
    if (typeof html2canvas === 'undefined') {
        console.error('html2canvas library not loaded!');
        alert('html2canvas bibliotek ikke lastet. Sjekk nettverksforbindelsen.');
        return null;
    }

    console.log('html2canvas is available, capturing map...');

    try {
        // SVG signs are inlined, tiles are CORS-enabled via proxy
        // Canvas should not be tainted
        const canvas = await html2canvas(mapElement, {
            scale: 2, // 2x resolution for print quality
            useCORS: true, // Use CORS-enabled tiles from proxy
            backgroundColor: '#ffffff',
            logging: false,
            windowWidth: mapElement.offsetWidth,
            windowHeight: mapElement.offsetHeight,
            ignoreElements: (element) => {
                return element.classList.contains('leaflet-control-container');
            }
        });

        console.log('Map captured successfully');
        console.log('Canvas details - Width:', canvas.width, 'Height:', canvas.height);
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
    return new Promise((resolve, reject) => {
        try {
            console.log('Creating blob from canvas...');
            console.log('Canvas size:', canvas.width, 'x', canvas.height);

            if (!canvas.toBlob) {
                console.error('toBlob not supported');
                reject(new Error('Browser does not support canvas.toBlob()'));
                return;
            }

            canvas.toBlob((blob) => {
                if (!blob) {
                    console.error('Failed to create blob');
                    reject(new Error('Failed to create blob from canvas'));
                    return;
                }

                console.log('Blob created successfully:', blob.size, 'bytes');

                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(() => URL.revokeObjectURL(url), 100);

                console.log(`Downloaded: ${filename}`);
                resolve();
            }, 'image/png');

        } catch (error) {
            console.error('Error downloading canvas:', error);
            reject(error);
        }
    });
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
