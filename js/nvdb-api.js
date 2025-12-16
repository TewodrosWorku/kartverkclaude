/**
 * NVDB API Les V4 Integration Module
 * Provides clean interface to Norwegian Road Database API
 * @module nvdb-api
 */

// Constants
const NVDB_BASE_URL = 'https://nvdbapiles.atlas.vegvesen.no';
const API_VERSION = 'v4';
const CLIENT_NAME = 'avplan-app';
const REQUEST_TIMEOUT = 10000; // 10 seconds

// CORS Proxy - required because NVDB API blocks external domains
// Using corsproxy.io - a reliable public CORS proxy
const USE_CORS_PROXY = true;
const CORS_PROXY = 'https://corsproxy.io/?';

/**
 * Make authenticated request to NVDB API
 * @param {string} endpoint - API endpoint path
 * @param {Object} params - Query parameters
 * @returns {Promise<Object|null>} Response data or null on error
 */
async function makeRequest(endpoint, params = {}) {
    try {
        // Build URL with query parameters
        const url = new URL(`${NVDB_BASE_URL}${endpoint}`);
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.append(key, params[key]);
            }
        });

        // Add CORS proxy if enabled (required for browser-based apps)
        const finalUrl = USE_CORS_PROXY
            ? `${CORS_PROXY}${encodeURIComponent(url.toString())}`
            : url.toString();

        console.log(`Making request to: ${USE_CORS_PROXY ? 'CORS Proxy → ' : ''}${url.toString()}`);

        // Setup timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

        // Make request
        const response = await fetch(finalUrl, {
            headers: {
                'X-Client': CLIENT_NAME,
                'Accept': 'application/json'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`NVDB API error: ${response.status} ${response.statusText}`);
            console.error(`URL: ${url.toString()}`);
            console.error(`Response body: ${errorText}`);
            return null;
        }

        const data = await response.json();
        console.log(`✓ API request successful: ${url.pathname}`);
        return data;

    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('NVDB API: Request timeout');
        } else if (error.name === 'TypeError') {
            console.error('NVDB API: Network error', error);
        } else {
            console.error('NVDB API: Error', error);
        }
        return null;
    }
}

/**
 * Find nearest road to a point
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} maxDistance - Maximum search distance in meters (default: 50)
 * @returns {Promise<Object|null>} Road object or null
 * @example
 * const road = await findNearestRoad(63.4305, 10.3951, 50);
 */
export async function findNearestRoad(lat, lon, maxDistance = 50) {
    console.log(`Finding nearest road to [${lat}, ${lon}] within ${maxDistance}m`);

    // NVDB API V4 Posisjon endpoint - finds nearest road to coordinates
    // Uses lat/lon for WGS84 coordinates and maks_avstand for max distance in meters
    const data = await makeRequest('/vegnett/api/v4/posisjon', {
        lat: lat,
        lon: lon,
        maks_avstand: maxDistance
    });

    // Response is an array, not an object with 'objekter'
    if (!data || !Array.isArray(data) || data.length === 0) {
        console.log('No roads found in area');
        return null;
    }

    // Get the first (closest) result
    const posisjon = data[0];
    console.log(`Found road at ${posisjon.avstand?.toFixed(1) || 0}m distance`);
    console.log('Posisjon response:', posisjon);

    // Extract road data from posisjon response
    const roadData = {
        veglenkesekvensid: posisjon.veglenkesekvens?.veglenkesekvensid,
        vegsystemreferanse: posisjon.vegsystemreferanse,
        geometry: posisjon.geometri,
        kommune: posisjon.kommune,
        avstand: posisjon.avstand,
        relativPosisjon: posisjon.veglenkesekvens?.relativPosisjon
    };

    console.log('Extracted veglenkesekvensid:', roadData.veglenkesekvensid);
    return roadData;
}

/**
 * Get detailed road information by ID (single sequence only)
 * @param {string} veglenkesekvensid - Road link sequence ID
 * @returns {Promise<Object|null>} Single sequence data with geometry
 * @example
 * const details = await getRoadDetails('123456');
 */
export async function getRoadDetails(veglenkesekvensid) {
    if (!veglenkesekvensid) {
        console.error('getRoadDetails: veglenkesekvensid is undefined or null');
        return null;
    }

    console.log(`Fetching road sequence details for ID: ${veglenkesekvensid}`);

    // Fetch just this single veglenkesekvens by ID
    // Note: The V4 API doesn't need inkluder parameter - it returns geometri by default
    const data = await makeRequest(`/vegnett/api/v4/veglenkesekvenser/${veglenkesekvensid}`);

    if (!data) {
        console.error('Failed to fetch road details - API returned invalid data');
        return null;
    }

    console.log(`Road sequence fetched successfully: ${data.lengde || 0}m with ${data.veglenker?.length || 0} veglenker`);

    return data;
}

/**
 * Get full category name in Norwegian
 * @param {string} code - Category code (E, R, F, K, P, S)
 * @returns {string} Full Norwegian name
 */
function getCategoryName(code) {
    const categories = {
        'E': 'Europaveg',
        'R': 'Riksveg',
        'F': 'Fylkesveg',
        'K': 'Kommunal veg',
        'P': 'Privat veg',
        'S': 'Skogsbilveg'
    };
    return categories[code] || 'Ukjent';
}

/**
 * Format road reference to human-readable string
 * @param {Object} vegsystemreferanse - Road system reference object from NVDB
 * @returns {string} Formatted road reference (e.g., "Ev6" or "Rv3 S12D3")
 * @example
 * const ref = formatRoadReference(roadData.vegsystemreferanse);
 * // Returns: "Ev6" or "Fv123"
 */
export function formatRoadReference(vegsystemreferanse, includeMeters = false) {
    if (!vegsystemreferanse) {
        return 'Ukjent vei';
    }

    // If kortform exists, use it but remove meter values for simplicity
    if (vegsystemreferanse.kortform) {
        let kortform = vegsystemreferanse.kortform;
        // Remove meter values (m123, m123-456) unless explicitly requested
        if (!includeMeters) {
            kortform = kortform.replace(/\s*m\d+(-\d+)?/, '');
        }
        return kortform;
    }

    try {
        const vegkategori = vegsystemreferanse.vegsystem?.vegkategori;
        const nummer = vegsystemreferanse.vegsystem?.nummer;
        const fase = vegsystemreferanse.vegsystem?.fase;
        const strekning = vegsystemreferanse.strekning?.strekning;
        const delstrekning = vegsystemreferanse.strekning?.delstrekning;
        const meter = vegsystemreferanse.strekning?.meter;

        // Map category codes to letters
        const categoryMap = {
            'E': 'E',   // Europa
            'R': 'R',   // Riks
            'F': 'F',   // Fylkes
            'K': 'K',   // Kommune
            'P': 'P',   // Privat
            'S': 'S'    // Skogsbil
        };

        const category = categoryMap[vegkategori] || vegkategori || '';

        // Base reference
        let reference = `${category}V${nummer || '?'}`;

        // Add stretch and sub-stretch if available
        if (strekning) {
            reference += ` S${strekning}`;
            if (delstrekning) {
                reference += `D${delstrekning}`;
            }
        }

        // Add meter position if available
        if (meter !== undefined) {
            reference += ` m${Math.round(meter)}`;
        }

        // Add phase if not standard (V = Existing)
        if (fase && fase !== 'V') {
            reference += ` (${fase})`;
        }

        return reference;

    } catch (error) {
        console.error('Error formatting road reference:', error);
        return 'Ukjent vei';
    }
}

/**
 * Get detailed road information as object
 * @param {Object} vegsystemreferanse - Road system reference object from NVDB
 * @returns {Object} Detailed road info
 */
export function getRoadInfo(vegsystemreferanse) {
    if (!vegsystemreferanse) {
        return null;
    }

    const vegkategori = vegsystemreferanse.vegsystem?.vegkategori;
    const categoryName = getCategoryName(vegkategori);

    return {
        kortform: formatRoadReference(vegsystemreferanse, false), // Don't include meters
        kategori: vegkategori,
        kategoriNavn: categoryName,
        nummer: vegsystemreferanse.vegsystem?.nummer,
        fase: vegsystemreferanse.vegsystem?.fase,
        strekning: vegsystemreferanse.strekning?.strekning,
        delstrekning: vegsystemreferanse.strekning?.delstrekning,
        meter: vegsystemreferanse.strekning?.meter,
        trafikantgruppe: vegsystemreferanse.strekning?.trafikantgruppe,
        retning: vegsystemreferanse.strekning?.retning
    };
}

/**
 * Transform coordinates from SRID 5973 (UTM 33N) to WGS84 (EPSG:4326)
 * @param {Array} coordinates - Coordinate array [x, y] in SRID 5973
 * @returns {Array} Transformed coordinates [lon, lat] in WGS84
 */
function transformCoordinates(coordinates) {
    // Check for proj4 in global scope (window)
    const proj4Lib = window.proj4 || self.proj4;

    if (!proj4Lib) {
        console.error('proj4 library not loaded, returning coordinates as-is');
        console.error('Original coordinates (SRID 5973):', coordinates);
        return coordinates;
    }

    try {
        // Define SRID 5973 (ETRS89 / UTM zone 33N) if not already defined
        if (!proj4Lib.defs('EPSG:5973')) {
            proj4Lib.defs('EPSG:5973', '+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs');
        }

        // Transform from SRID 5973 to WGS84
        const transformed = proj4Lib('EPSG:5973', 'EPSG:4326', coordinates);
        console.log(`Transformed ${coordinates} -> ${transformed}`);
        return transformed;
    } catch (error) {
        console.error('Error transforming coordinates:', error);
        return coordinates;
    }
}

/**
 * Parse WKT (Well-Known Text) geometry to GeoJSON with automatic coordinate transformation
 * Transforms from SRID 5973 (Norwegian UTM) to WGS84 (EPSG:4326)
 * @param {string} wkt - WKT geometry string
 * @param {number} srid - Source SRID (default: 5973)
 * @returns {Object|null} GeoJSON geometry object in WGS84
 * @example
 * const geojson = parseWKTToGeoJSON('LINESTRING Z (-34433 6569082 9, ...)', 5973);
 */
export function parseWKTToGeoJSON(wkt, srid = 5973) {
    if (!wkt || typeof wkt !== 'string') {
        console.error('Invalid WKT input');
        return null;
    }

    try {
        // Simple parser for common geometry types
        wkt = wkt.trim();

        // POINT (supports both 2D and 3D with Z coordinate)
        if (wkt.startsWith('POINT')) {
            const coords = wkt.match(/POINT\s*Z?\s*\(([^)]+)\)/i);
            if (coords) {
                const values = coords[1].trim().split(/\s+/).map(Number);
                const [x, y] = values; // Ignore Z if present
                const transformed = srid === 5973 ? transformCoordinates([x, y]) : [x, y];
                return {
                    type: 'Point',
                    coordinates: transformed
                };
            }
        }

        // LINESTRING (supports both 2D and 3D with Z coordinate)
        if (wkt.startsWith('LINESTRING')) {
            const coords = wkt.match(/LINESTRING\s*Z?\s*\(([^)]+)\)/i);
            if (coords) {
                const points = coords[1].split(',').map(pair => {
                    const values = pair.trim().split(/\s+/).map(Number);
                    const [x, y] = values; // Ignore Z if present
                    return srid === 5973 ? transformCoordinates([x, y]) : [x, y];
                });
                console.log(`Parsed LINESTRING with ${points.length} points`);
                console.log('First point:', points[0], 'Last point:', points[points.length - 1]);
                return {
                    type: 'LineString',
                    coordinates: points
                };
            }
        }

        // POLYGON (supports both 2D and 3D with Z coordinate)
        if (wkt.startsWith('POLYGON')) {
            const coords = wkt.match(/POLYGON\s*Z?\s*\(\(([^)]+)\)\)/i);
            if (coords) {
                const points = coords[1].split(',').map(pair => {
                    const values = pair.trim().split(/\s+/).map(Number);
                    const [x, y] = values; // Ignore Z if present
                    return srid === 5973 ? transformCoordinates([x, y]) : [x, y];
                });
                return {
                    type: 'Polygon',
                    coordinates: [points]
                };
            }
        }

        // MULTILINESTRING (supports both 2D and 3D with Z coordinate)
        if (wkt.startsWith('MULTILINESTRING')) {
            const match = wkt.match(/MULTILINESTRING\s*Z?\s*\((.+)\)/i);
            if (match) {
                const lineStrings = match[1].match(/\([^)]+\)/g);
                if (lineStrings) {
                    const coordinates = lineStrings.map(lineString => {
                        const coords = lineString.replace(/[()]/g, '');
                        return coords.split(',').map(pair => {
                            const values = pair.trim().split(/\s+/).map(Number);
                            const [x, y] = values; // Ignore Z if present
                            return srid === 5973 ? transformCoordinates([x, y]) : [x, y];
                        });
                    });
                    return {
                        type: 'MultiLineString',
                        coordinates: coordinates
                    };
                }
            }
        }

        console.error('Unsupported WKT geometry type');
        return null;

    } catch (error) {
        console.error('Error parsing WKT:', error);
        return null;
    }
}

// Export all functions
export default {
    findNearestRoad,
    getRoadDetails,
    formatRoadReference,
    getRoadInfo,
    parseWKTToGeoJSON
};
