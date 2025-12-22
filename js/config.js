/**
 * Application Configuration
 * @module config
 */

/**
 * Tile server configuration
 *
 * IMPORTANT: To enable map export functionality, you MUST use the tile proxy server
 * because Kartverket tiles don't have CORS headers.
 *
 * Development: Use TILE_SERVER_DIRECT (no export)
 * Production: Use TILE_SERVER_PROXY (export works)
 */

// Direct Kartverket tiles (no CORS headers - export won't work)
const TILE_SERVER_DIRECT = 'https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png';

// Proxy server tiles (with CORS headers - export works)
// REPLACE YOUR_SERVER_IP with your actual Hetzner IPv4 address
const TILE_SERVER_PROXY = 'http://46.62.141.169:8080/tiles/{z}/{y}/{x}.png';

// Active configuration
// Using TILE_SERVER_DIRECT because GitHub Pages requires HTTPS
// Note: Map export may not work without CORS headers, but tiles will load
export const TILE_SERVER_URL = TILE_SERVER_DIRECT;

/**
 * Map configuration
 */
export const MAP_CONFIG = {
    center: [60.391, 5.324], // Bergen, Norway
    zoom: 13,
    minZoom: 3,
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.kartverket.no/">Kartverket</a>'
};

/**
 * NVDB API configuration
 */
export const NVDB_API = {
    baseUrl: 'https://nvdbapiles-v3.atlas.vegvesen.no',
    timeout: 10000
};

export default {
    TILE_SERVER_URL,
    MAP_CONFIG,
    NVDB_API
};
