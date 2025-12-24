/**
 * Address Search Module
 * Integrates with Geonorge API for Norwegian address geocoding
 * @module address-search
 */

import { getMap } from './map-manager.js';

// Constants
const GEONORGE_API = 'https://ws.geonorge.no/adresser/v1/sok';
const DEBOUNCE_DELAY = 300; // milliseconds

// State
let searchResultsElement = null;
let currentMarker = null;
let debounceTimer = null;
let currentSearchController = null; // Track current search to abort stale requests

/**
 * Debounce function to delay API calls
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, delay) {
    return function(...args) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Search for Norwegian addresses (with abort control for race condition prevention)
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of addresses or empty array on error
 */
async function searchAddress(query) {
    if (!query || query.length < 3) {
        return [];
    }

    // Abort any previous search in progress
    if (currentSearchController) {
        currentSearchController.abort();
    }

    // Create new controller for this search
    const controller = new AbortController();
    currentSearchController = controller;

    try {
        const url = `${GEONORGE_API}?fuzzy=true&sok=${encodeURIComponent(query)}`;

        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.error('Geonorge API error:', response.status);
            return [];
        }

        const data = await response.json();

        // Only return results if this is still the current search
        if (controller === currentSearchController) {
            if (data.adresser && Array.isArray(data.adresser)) {
                return data.adresser.slice(0, 5); // Return top 5 results
            }
        }

        return [];

    } catch (error) {
        if (error.name === 'AbortError') {
            // Silently ignore aborts (they're expected when aborting stale searches)
            return [];
        } else {
            console.error('Address search error:', error);
        }
        return [];
    } finally {
        // Clear controller reference if this was the current search
        if (controller === currentSearchController) {
            currentSearchController = null;
        }
    }
}

/**
 * Display search results in dropdown
 * @param {Array} addresses - Array of address objects
 */
function displaySearchResults(addresses) {
    if (!searchResultsElement) {
        createSearchResultsElement();
    }

    // Clear previous results
    searchResultsElement.innerHTML = '';

    if (addresses.length === 0) {
        searchResultsElement.innerHTML = '<div class="search-result-item">Ingen resultater funnet</div>';
        searchResultsElement.style.display = 'block';
        return;
    }

    // Create result items
    addresses.forEach(address => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.textContent = address.adressetekst;
        item.style.padding = '10px';
        item.style.cursor = 'pointer';
        item.style.borderBottom = '1px solid #eee';

        item.addEventListener('mouseenter', () => {
            item.style.backgroundColor = '#f0f0f0';
        });

        item.addEventListener('mouseleave', () => {
            item.style.backgroundColor = 'white';
        });

        item.addEventListener('click', () => {
            selectAddress(address);
        });

        searchResultsElement.appendChild(item);
    });

    searchResultsElement.style.display = 'block';
}

/**
 * Create search results dropdown element
 */
function createSearchResultsElement() {
    searchResultsElement = document.createElement('div');
    searchResultsElement.id = 'searchResults';
    searchResultsElement.style.cssText = `
        position: absolute;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        max-height: 300px;
        overflow-y: auto;
        z-index: 1002;
        display: none;
        width: calc(100% - 30px);
        margin-top: 5px;
    `;

    // Insert after search input
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer) {
        searchContainer.parentElement.insertBefore(searchResultsElement, searchContainer.nextSibling);
    }
}

/**
 * Select an address and pan to location
 * @param {Object} address - Address object from Geonorge
 */
function selectAddress(address) {
    console.log('Selected address:', address.adressetekst);

    const map = getMap();
    if (!map) {
        console.error('Map not available');
        return;
    }

    // Extract coordinates
    const lat = address.representasjonspunkt?.lat;
    const lon = address.representasjonspunkt?.lon;

    if (!lat || !lon) {
        console.error('Address has no coordinates');
        return;
    }

    // Pan to location
    map.setView([lat, lon], 15);

    // Remove previous marker
    if (currentMarker) {
        map.removeLayer(currentMarker);
    }

    // Add temporary marker
    currentMarker = L.marker([lat, lon], {
        icon: L.icon({
            iconUrl: 'assets/markers/marker-icon-red.png',
            shadowUrl: 'assets/markers/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        })
    }).addTo(map);

    // Bind popup
    currentMarker.bindPopup(address.adressetekst).openPopup();

    // Remove marker after 3 seconds
    setTimeout(() => {
        if (currentMarker) {
            map.removeLayer(currentMarker);
            currentMarker = null;
        }
    }, 3000);

    // Hide search results
    hideSearchResults();

    // Update status
    const statusText = document.getElementById('statusText');
    if (statusText) {
        statusText.textContent = `Gått til: ${address.adressetekst}`;
    }
}

/**
 * Hide search results dropdown
 */
function hideSearchResults() {
    if (searchResultsElement) {
        searchResultsElement.style.display = 'none';
    }
}

/**
 * Handle search input
 */
const handleSearchInput = debounce(async (event) => {
    const query = event.target.value.trim();

    if (query.length < 3) {
        hideSearchResults();
        return;
    }

    const addresses = await searchAddress(query);
    displaySearchResults(addresses);
}, DEBOUNCE_DELAY);

/**
 * Handle search button click
 */
async function handleSearchButton() {
    const input = document.getElementById('searchInput');
    if (!input) return;

    const query = input.value.trim();

    if (query.length < 3) {
        alert('Skriv minst 3 tegn for å søke');
        return;
    }

    const addresses = await searchAddress(query);
    displaySearchResults(addresses);
}

/**
 * Setup address search functionality
 */
function setupAddressSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    if (!searchInput || !searchBtn) {
        console.error('Search elements not found');
        return;
    }

    // Add input listener with debouncing
    searchInput.addEventListener('input', handleSearchInput);

    // Add Enter key listener
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearchButton();
        }
    });

    // Add button click listener
    searchBtn.addEventListener('click', handleSearchButton);

    // Hide results when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) &&
            searchResultsElement &&
            !searchResultsElement.contains(e.target)) {
            hideSearchResults();
        }
    });

    // Keyboard navigation
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideSearchResults();
        }
    });

    console.log('Address search setup complete');
}

/**
 * Initialize address search module
 */
export function initAddressSearch() {
    setupAddressSearch();
}

export default {
    initAddressSearch
};
