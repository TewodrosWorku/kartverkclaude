/**
 * AV-Plan Main Application Controller
 * Entry point and orchestration of all modules
 * @module app
 */

import { initializeMap, setupMapClickHandler, toggleRoadLayer } from './map-manager.js';
import { initAddressSearch } from './address-search.js';
import { initWorkZone, setDistanceMarkersCallback } from './work-zone.js';
import { updateDistanceMarkers, toggleDistanceMarkers } from './distance-markers.js';
import { initSignManager } from './sign-manager.js';
import { TextBoxManager } from './textbox-manager.js';
import { exportMapImage } from './export.js';
import { saveProject, loadProject, renderProjectList, showSaveProjectDialog, clearCurrentProject } from './project-manager.js';

// Application state
const appState = {
    initialized: false,
    currentTab: 'map'
};

// Global instances
let textBoxManager = null;

/**
 * Initialize the entire application
 */
async function initializeApplication() {
    try {
        console.log('Initializing AV-Plan...');

        // Show loading screen
        showLoadingScreen();

        // Initialize modules in order

        // 1. Initialize map (core dependency)
        console.log('1. Initializing map...');
        initializeMap();
        setupMapClickHandler();

        // 2. Initialize address search
        console.log('2. Initializing address search...');
        initAddressSearch();

        // 3. Initialize work zone system
        console.log('3. Initializing work zone...');
        initWorkZone();

        // 4. Set up distance markers callback
        setDistanceMarkersCallback(updateDistanceMarkers);

        // 5. Initialize sign manager
        console.log('4. Initializing sign manager...');
        await initSignManager();

        // 6. Initialize text box manager
        console.log('5. Initializing text box manager...');
        const { getMap } = await import('./map-manager.js');
        const map = getMap();
        textBoxManager = new TextBoxManager(map);

        // 7. Setup all event listeners
        console.log('6. Setting up event listeners...');
        setupEventListeners();

        // 8. Setup tab system
        console.log('7. Setting up tab system...');
        setupTabSystem();

        // 9. Load project list
        console.log('8. Loading project list...');
        renderProjectList();

        // 10. Setup keyboard shortcuts
        setupKeyboardShortcuts();

        // 11. Setup error handlers
        setupGlobalErrorHandlers();

        // Mark as initialized
        appState.initialized = true;

        // Hide loading screen
        hideLoadingScreen();

        console.log('✅ AV-Plan initialized successfully!');

        // Update status
        updateUIStatus();

    } catch (error) {
        console.error('Failed to initialize application:', error);
        hideLoadingScreen();
        alert('Kunne ikke starte applikasjonen. Sjekk konsollen for detaljer.');
    }
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Road selection button
    setupRoadSelectionButton();

    // Export button
    setupExportButton();

    // Save project button
    setupSaveButton();

    // New project button
    setupNewProjectButton();

    // Setting toggles
    setupSettingToggles();

    // Window resize
    setupResizeHandler();

    console.log('Event listeners setup complete');
}

/**
 * Setup road selection button
 */
function setupRoadSelectionButton() {
    const selectRoadBtn = document.getElementById('selectRoadBtn');

    if (selectRoadBtn) {
        selectRoadBtn.addEventListener('click', () => {
            console.log('Select road button clicked');

            import('./map-manager.js').then(module => {
                module.activateRoadSelectionMode();
            });
        });
    }
}

/**
 * Setup export button
 */
function setupExportButton() {
    const exportBtn = document.getElementById('exportBtn');

    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            console.log('Export button clicked');

            try {
                await exportMapImage();
            } catch (error) {
                console.error('Export error:', error);
                alert('Eksport feilet. Prøv igjen.');
            }
        });
    }
}

/**
 * Setup save project button
 */
function setupSaveButton() {
    const saveBtn = document.getElementById('saveProjectBtn');

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            console.log('Save button clicked');
            showSaveProjectDialog();
        });
    }
}

/**
 * Setup new project button
 */
function setupNewProjectButton() {
    const newBtn = document.getElementById('newProjectBtn');

    if (newBtn) {
        newBtn.addEventListener('click', () => {
            console.log('New project button clicked');

            const confirm = window.confirm('Start nytt prosjekt? Ulagrede endringer vil gå tapt.');

            if (confirm) {
                clearCurrentProject();
                updateUIStatus();
            }
        });
    }
}

/**
 * Setup setting toggles
 */
function setupSettingToggles() {
    // Snap toggle
    const snapToggle = document.getElementById('snapToggle');
    if (snapToggle) {
        snapToggle.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            console.log(`Snap to road: ${enabled}`);

            // Update work zone snap setting
            import('./work-zone.js').then(module => {
                module.toggleSnapping(enabled);
            });
        });
    }

    // Marker toggle
    const markerToggle = document.getElementById('markerToggle');
    if (markerToggle) {
        markerToggle.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            console.log(`Show distance markers: ${enabled}`);

            toggleDistanceMarkers(enabled);
        });
    }

    // Road layer toggle
    const roadLayerToggle = document.getElementById('roadLayerToggle');
    if (roadLayerToggle) {
        roadLayerToggle.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            console.log(`Show road layer: ${enabled}`);

            toggleRoadLayer(enabled);
        });
    }
}

/**
 * Setup tab system
 */
function setupTabSystem() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    console.log('Tab system setup complete');
}

/**
 * Switch to a specific tab
 * @param {string} tabName - Tab name to switch to
 */
function switchTab(tabName) {
    console.log(`Switching to tab: ${tabName}`);

    appState.currentTab = tabName;

    // Update tab buttons
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        if (tab.getAttribute('data-tab') === tabName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    // Update tab content
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
    });

    // Show matching content
    const contentId = `${tabName}Tab`;
    const activeContent = document.getElementById(contentId);
    if (activeContent) {
        activeContent.classList.add('active');
    }

    // If projects tab, refresh list
    if (tabName === 'projects') {
        renderProjectList();
    }
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + S: Save project
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            showSaveProjectDialog();
        }

        // Ctrl/Cmd + E: Export
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            exportMapImage();
        }

        // Ctrl/Cmd + N: New project
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            if (confirm('Start nytt prosjekt?')) {
                clearCurrentProject();
            }
        }

        // Escape: Cancel current mode
        if (e.key === 'Escape') {
            // Could add mode cancellation here
        }
    });

    console.log('Keyboard shortcuts setup');
}

/**
 * Setup resize handler
 */
function setupResizeHandler() {
    let resizeTimer;

    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);

        resizeTimer = setTimeout(() => {
            console.log('Window resized');

            // Invalidate map size
            import('./map-manager.js').then(module => {
                const map = module.getMap();
                if (map) {
                    map.invalidateSize();
                }
            });
        }, 250);
    });
}

/**
 * Setup global error handlers
 */
function setupGlobalErrorHandlers() {
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        handleError(event.error, 'global');
    });

    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        handleError(event.reason, 'promise');
    });
}

/**
 * Handle application errors
 * @param {Error} error - Error object
 * @param {string} context - Error context
 */
function handleError(error, context) {
    console.error(`Error in ${context}:`, error);

    // Update status
    const statusText = document.getElementById('statusText');
    if (statusText) {
        statusText.textContent = 'En feil oppstod';
        statusText.style.color = '#dc3545';
    }

    // Don't crash the app - just log and continue
}

/**
 * Update UI status displays
 */
function updateUIStatus() {
    // This will be called by various modules
    console.log('UI status updated');
}

/**
 * Show loading screen
 */
function showLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.add('active');
        loadingScreen.style.display = 'flex';
    }
}

/**
 * Hide loading screen
 */
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.remove('active');

        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 300);
    }
}

/**
 * Initialize application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded');

    try {
        await initializeApplication();
    } catch (error) {
        handleError(error, 'initialization');
    }
});

// Export for debugging
if (typeof window !== 'undefined') {
    window.appState = appState;
}

// Export text box manager for other modules
export function getTextBoxManager() {
    return textBoxManager;
}

console.log('AV-Plan app.js loaded');
