/**
 * Project Manager Module
 * Handles project save/load using localStorage
 * @module project-manager
 */

import { getMap, getSelectedRoad, selectRoadAtPoint, clearSelectedRoad } from './map-manager.js';
import { getWorkZone, placeStartMarker, placeEndMarker, clearWorkZone, workZoneState } from './work-zone.js';
import { getPlacedSigns, restoreSigns, clearAllSigns } from './sign-manager.js';
import { updateDistanceMarkers, clearDistanceMarkers } from './distance-markers.js';

// Project state
export const projectState = {
    currentProject: null,
    settings: {
        snapToRoad: true,
        showDistanceMarkers: true
    }
};

/**
 * Save current project to localStorage
 * @param {string} projectName - Name for the project
 * @param {Object} metadata - Optional metadata (preparer, company, contact)
 * @returns {Object|null} Saved project object
 */
export function saveProject(projectName, metadata = {}) {
    try {
        if (!projectName || projectName.trim() === '') {
            alert('Vennligst oppgi et prosjektnavn');
            return null;
        }

        // Check if storage is available
        if (!isStorageAvailable()) {
            alert('Kan ikke lagre: localStorage er fullt eller utilgjengelig');
            return null;
        }

        const map = getMap();
        const road = getSelectedRoad();
        const workZone = getWorkZone();
        const signs = getPlacedSigns();

        // Create project object
        const project = {
            id: projectState.currentProject?.id || Date.now(),
            name: projectName.trim(),
            created: projectState.currentProject?.created || new Date().toISOString(),
            modified: new Date().toISOString(),

            metadata: {
                preparer: metadata.preparer || '',
                company: metadata.company || '',
                contact: metadata.contact || '',
                roadReference: road ? road.vegsystemreferanse : null
            },

            mapState: {
                center: map ? [map.getCenter().lat, map.getCenter().lng] : [63.4305, 10.3951],
                zoom: map ? map.getZoom() : 5
            },

            selectedRoad: road ? {
                id: road.veglenkesekvensid,
                reference: road.vegsystemreferanse,
                geometry: road.geojson
            } : null,

            workZone: workZone ? {
                start: [workZone.start.lat, workZone.start.lng],
                end: [workZone.end.lat, workZone.end.lng]
            } : {
                start: null,
                end: null
            },

            signs: signs || [],

            settings: {
                snapToRoad: projectState.settings.snapToRoad,
                showDistanceMarkers: projectState.settings.showDistanceMarkers
            }
        };

        // Save to localStorage
        const key = `avplan_${project.id}`;
        localStorage.setItem(key, JSON.stringify(project));

        // Update current project
        projectState.currentProject = project;

        console.log(`Project saved: ${projectName}`);

        // Update status
        const statusText = document.getElementById('statusText');
        if (statusText) {
            statusText.textContent = `Prosjekt lagret: ${projectName}`;
        }

        return project;

    } catch (error) {
        console.error('Error saving project:', error);
        alert('Kunne ikke lagre prosjekt. Sjekk konsollen for detaljer.');
        return null;
    }
}

/**
 * Load project from localStorage
 * @param {number} projectId - Project ID to load
 * @returns {boolean} Success status
 */
export function loadProject(projectId) {
    try {
        // Get project from localStorage
        const key = `avplan_${projectId}`;
        const projectData = localStorage.getItem(key);

        if (!projectData) {
            alert('Prosjekt ikke funnet');
            return false;
        }

        const project = JSON.parse(projectData);

        // Validate structure
        if (!project.id || !project.name) {
            alert('Ugyldig prosjektdata');
            return false;
        }

        // Clear current state
        clearCurrentProject();

        // Restore map view
        const map = getMap();
        if (map && project.mapState) {
            map.setView(project.mapState.center, project.mapState.zoom);
        }

        // Restore selected road
        if (project.selectedRoad && project.selectedRoad.geometry) {
            // Store road data temporarily in map state
            import('./map-manager.js').then(module => {
                module.mapState.selectedRoad = {
                    veglenkesekvensid: project.selectedRoad.id,
                    vegsystemreferanse: project.selectedRoad.reference,
                    geojson: project.selectedRoad.geometry
                };

                // Display road
                module.displayRoad(
                    {
                        vegsystemreferanse: project.selectedRoad.reference,
                        kommune: []
                    },
                    project.selectedRoad.geometry
                );
            });
        }

        // Restore work zone markers
        if (project.workZone) {
            if (project.workZone.start) {
                const startLatLng = L.latLng(project.workZone.start[0], project.workZone.start[1]);
                placeStartMarker(startLatLng);
            }

            if (project.workZone.end) {
                const endLatLng = L.latLng(project.workZone.end[0], project.workZone.end[1]);
                placeEndMarker(endLatLng);
            }
        }

        // Restore signs
        if (project.signs && project.signs.length > 0) {
            restoreSigns(project.signs);
        }

        // Restore settings
        if (project.settings) {
            projectState.settings = { ...project.settings };

            // Update toggles
            const snapToggle = document.getElementById('snapToggle');
            if (snapToggle) {
                snapToggle.checked = project.settings.snapToRoad;
            }

            const markerToggle = document.getElementById('markerToggle');
            if (markerToggle) {
                markerToggle.checked = project.settings.showDistanceMarkers;
            }
        }

        // Update distance markers
        updateDistanceMarkers();

        // Set current project
        projectState.currentProject = project;

        console.log(`Project loaded: ${project.name}`);

        // Update status
        const statusText = document.getElementById('statusText');
        if (statusText) {
            statusText.textContent = `Prosjekt lastet: ${project.name}`;
        }

        return true;

    } catch (error) {
        console.error('Error loading project:', error);
        alert('Kunne ikke laste prosjekt. Sjekk konsollen for detaljer.');
        return false;
    }
}

/**
 * List all saved projects
 * @returns {Array} Array of project summaries
 */
export function listProjects() {
    const projects = [];

    try {
        // Iterate through localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);

            // Filter AV-Plan projects
            if (key && key.startsWith('avplan_')) {
                const projectData = localStorage.getItem(key);

                if (projectData) {
                    try {
                        const project = JSON.parse(projectData);

                        projects.push({
                            id: project.id,
                            name: project.name,
                            modified: project.modified,
                            created: project.created,
                            roadReference: project.metadata?.roadReference
                        });
                    } catch (parseError) {
                        console.error(`Error parsing project ${key}:`, parseError);
                    }
                }
            }
        }

        // Sort by modified date (newest first)
        projects.sort((a, b) => new Date(b.modified) - new Date(a.modified));

        console.log(`Found ${projects.length} projects`);
        return projects;

    } catch (error) {
        console.error('Error listing projects:', error);
        return [];
    }
}

/**
 * Delete a project
 * @param {number} projectId - Project ID to delete
 * @returns {boolean} Success status
 */
export function deleteProject(projectId) {
    try {
        const key = `avplan_${projectId}`;

        // Check if exists
        if (!localStorage.getItem(key)) {
            alert('Prosjekt ikke funnet');
            return false;
        }

        // Confirm deletion
        if (!confirm('Er du sikker på at du vil slette dette prosjektet?')) {
            return false;
        }

        // Remove from localStorage
        localStorage.removeItem(key);

        // If current project, clear it
        if (projectState.currentProject && projectState.currentProject.id === projectId) {
            clearCurrentProject();
        }

        console.log(`Project deleted: ${projectId}`);

        // Refresh project list
        renderProjectList();

        return true;

    } catch (error) {
        console.error('Error deleting project:', error);
        alert('Kunne ikke slette prosjekt');
        return false;
    }
}

/**
 * Duplicate a project
 * @param {number} projectId - Project ID to duplicate
 * @returns {Object|null} New project object
 */
export function duplicateProject(projectId) {
    try {
        const key = `avplan_${projectId}`;
        const projectData = localStorage.getItem(key);

        if (!projectData) {
            alert('Prosjekt ikke funnet');
            return null;
        }

        const original = JSON.parse(projectData);

        // Create new project with same data
        const duplicate = {
            ...original,
            id: Date.now(),
            name: `${original.name} (kopi)`,
            created: new Date().toISOString(),
            modified: new Date().toISOString()
        };

        // Save duplicate
        const newKey = `avplan_${duplicate.id}`;
        localStorage.setItem(newKey, JSON.stringify(duplicate));

        console.log(`Project duplicated: ${duplicate.name}`);

        // Refresh project list
        renderProjectList();

        return duplicate;

    } catch (error) {
        console.error('Error duplicating project:', error);
        alert('Kunne ikke duplisere prosjekt');
        return null;
    }
}

/**
 * Clear current project state
 */
export function clearCurrentProject() {
    // Clear map layers
    clearSelectedRoad();
    clearWorkZone();
    clearAllSigns();
    clearDistanceMarkers();

    // Reset current project
    projectState.currentProject = null;

    console.log('Current project cleared');
}

/**
 * Check if localStorage is available and has space
 * @returns {boolean} Storage availability
 */
export function isStorageAvailable() {
    try {
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);

        // Check quota (rough estimate)
        const used = JSON.stringify(localStorage).length;
        const limit = 5 * 1024 * 1024; // 5MB estimate

        if (used > limit * 0.8) {
            console.warn('localStorage is nearly full');
        }

        return true;

    } catch (error) {
        console.error('localStorage not available:', error);
        return false;
    }
}

/**
 * Get current project
 * @returns {Object|null} Current project
 */
export function getCurrentProject() {
    return projectState.currentProject;
}

/**
 * Render project list in UI
 */
export function renderProjectList() {
    const projectListElement = document.getElementById('projectList');

    if (!projectListElement) {
        console.error('Project list element not found');
        return;
    }

    const projects = listProjects();

    if (projects.length === 0) {
        projectListElement.innerHTML = '<p class="text-muted">Ingen lagrede prosjekter</p>';
        return;
    }

    // Clear existing content
    projectListElement.innerHTML = '';

    // Render each project
    projects.forEach(project => {
        const projectItem = document.createElement('div');
        projectItem.className = 'project-item';
        projectItem.setAttribute('data-id', project.id);

        const modifiedDate = new Date(project.modified).toLocaleDateString('no-NO');

        projectItem.innerHTML = `
            <div class="project-name">${project.name}</div>
            <div class="project-meta">
                ${project.roadReference ? 'Vei: informasjon tilgjengelig<br>' : ''}
                <small>Endret: ${modifiedDate}</small>
            </div>
            <div class="project-actions">
                <button class="btn btn-primary" onclick="window.loadProjectById(${project.id})">
                    Åpne
                </button>
                <button class="btn btn-secondary" onclick="window.duplicateProjectById(${project.id})">
                    Dupliser
                </button>
                <button class="btn btn-danger" onclick="window.deleteProjectById(${project.id})">
                    Slett
                </button>
            </div>
        `;

        projectListElement.appendChild(projectItem);
    });

    console.log('Project list rendered');
}

/**
 * Show save project dialog
 */
export function showSaveProjectDialog() {
    const projectName = prompt('Skriv inn prosjektnavn:');

    if (projectName) {
        const saved = saveProject(projectName);

        if (saved) {
            alert('Prosjekt lagret!');
            renderProjectList();
        }
    }
}

// Make functions globally available for HTML buttons
if (typeof window !== 'undefined') {
    window.loadProjectById = loadProject;
    window.deleteProjectById = deleteProject;
    window.duplicateProjectById = duplicateProject;
}

export default {
    saveProject,
    loadProject,
    listProjects,
    deleteProject,
    duplicateProject,
    clearCurrentProject,
    isStorageAvailable,
    getCurrentProject,
    renderProjectList,
    showSaveProjectDialog
};
