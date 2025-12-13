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

        // Setup timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

        // Make request
        const response = await fetch(url.toString(), {
            headers: {
                'X-Client': CLIENT_NAME,
                'Accept': 'application/json'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.error(`NVDB API error: ${response.status} ${response.statusText}`);
            return null;
        }

        const data = await response.json();
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

    // NVDB API V4 uses bounding box (kartutsnitt) instead of point + distance
    // Convert maxDistance to degrees (rough approximation: 1 degree ≈ 111km)
    const distanceInDegrees = maxDistance / 111000;

    // Create bounding box around the point
    const minLon = lon - distanceInDegrees;
    const maxLon = lon + distanceInDegrees;
    const minLat = lat - distanceInDegrees;
    const maxLat = lat + distanceInDegrees;

    // Format as bounding box: minLon,minLat,maxLon,maxLat (NOT WKT POLYGON)
    // NVDB API V4 expects: {Xmin, Ymin, Xmax, Ymax} with srid=4326 for WGS84
    const kartutsnitt = `${minLon},${minLat},${maxLon},${maxLat}`;

    const data = await makeRequest('/api/v4/veglenkesekvenser/segmentert', {
        kartutsnitt: kartutsnitt,
        srid: '4326'  // EPSG:4326 = WGS84
    });

    if (!data || !data.objekter || data.objekter.length === 0) {
        console.log('No roads found in area');
        return null;
    }

    // Find the closest road using turf.js if available
    let closestRoad = data.objekter[0];

    if (typeof turf !== 'undefined' && data.objekter.length > 1) {
        const clickPoint = turf.point([lon, lat]);
        let minDistance = Infinity;

        for (const road of data.objekter) {
            if (road.geometri && road.geometri.wkt) {
                try {
                    const roadGeom = parseWKTToGeoJSON(road.geometri.wkt);
                    if (roadGeom) {
                        let roadLine;
                        if (roadGeom.type === 'LineString') {
                            roadLine = turf.lineString(roadGeom.coordinates);
                        } else if (roadGeom.type === 'MultiLineString') {
                            roadLine = turf.lineString(roadGeom.coordinates[0]);
                        }

                        if (roadLine) {
                            const nearestPoint = turf.nearestPointOnLine(roadLine, clickPoint);
                            const distance = turf.distance(clickPoint, nearestPoint, { units: 'meters' });

                            if (distance < minDistance) {
                                minDistance = distance;
                                closestRoad = road;
                            }
                        }
                    }
                } catch (error) {
                    console.warn('Error calculating distance for road:', error);
                }
            }
        }

        console.log(`Found closest road at ${minDistance.toFixed(1)}m`);
    }

    // Extract road data
    return {
        veglenkesekvensid: closestRoad.veglenkesekvensid,
        vegsystemreferanse: closestRoad.vegsystemreferanse,
        geometry: closestRoad.geometri,
        kommune: closestRoad.kommune
    };
}

/**
 * Get detailed road information by ID
 * @param {string} veglenkesekvensid - Road link sequence ID
 * @returns {Promise<Object|null>} Full road data with geometry
 * @example
 * const details = await getRoadDetails('123456');
 */
export async function getRoadDetails(veglenkesekvensid) {
    console.log(`Fetching road details for ID: ${veglenkesekvensid}`);

    const data = await makeRequest(`/api/v4/veglenkesekvenser/${veglenkesekvensid}`, {
        inkluder: 'geometri,vegsystemreferanse'
    });

    if (!data) {
        console.log('Invalid API response');
        return null;
    }

    return data;
}

/**
 * Format road reference to human-readable string
 * @param {Object} vegsystemreferanse - Road system reference object from NVDB
 * @returns {string} Formatted road reference (e.g., "Ev6" or "Rv3 S12D3")
 * @example
 * const ref = formatRoadReference(roadData.vegsystemreferanse);
 * // Returns: "Ev6" or "Fv123"
 */
export function formatRoadReference(vegsystemreferanse) {
    if (!vegsystemreferanse) {
        return 'Ukjent vei';
    }

    try {
        const vegkategori = vegsystemreferanse.vegsystem?.vegkategori;
        const nummer = vegsystemreferanse.vegsystem?.nummer;
        const fase = vegsystemreferanse.vegsystem?.fase;
        const strekning = vegsystemreferanse.strekning?.nummer;
        const delstrekning = vegsystemreferanse.strekning?.delstrekning;

        // Map category codes to letters
        const categoryMap = {
            'E': 'E',   // Europa
            'R': 'R',   // Riks
            'F': 'F',   // Fylkes
            'K': 'K',   // Kommune
            'P': 'P'    // Privat
        };

        const category = categoryMap[vegkategori] || vegkategori || '';

        // Base reference
        let reference = `${category}v${nummer || '?'}`;

        // Add phase if not standard (V = Vegstatus)
        if (fase && fase !== 'V') {
            reference += ` (${fase})`;
        }

        // Add stretch and sub-stretch if available
        if (strekning) {
            reference += ` S${strekning}`;
            if (delstrekning) {
                reference += `D${delstrekning}`;
            }
        }

        return reference;

    } catch (error) {
        console.error('Error formatting road reference:', error);
        return 'Ukjent vei';
    }
}

/**
 * Parse WKT (Well-Known Text) geometry to GeoJSON
 * Note: This is a simplified parser. For production, use a library like 'wellknown'
 * @param {string} wkt - WKT geometry string
 * @returns {Object|null} GeoJSON geometry object
 * @example
 * const geojson = parseWKTToGeoJSON('LINESTRING(10.1 63.4, 10.2 63.5)');
 */
export function parseWKTToGeoJSON(wkt) {
    if (!wkt || typeof wkt !== 'string') {
        console.error('Invalid WKT input');
        return null;
    }

    try {
        // Simple parser for common geometry types
        wkt = wkt.trim();

        // POINT
        if (wkt.startsWith('POINT')) {
            const coords = wkt.match(/POINT\s*\(([^)]+)\)/i);
            if (coords) {
                const [lon, lat] = coords[1].trim().split(/\s+/).map(Number);
                return {
                    type: 'Point',
                    coordinates: [lon, lat]
                };
            }
        }

        // LINESTRING
        if (wkt.startsWith('LINESTRING')) {
            const coords = wkt.match(/LINESTRING\s*\(([^)]+)\)/i);
            if (coords) {
                const points = coords[1].split(',').map(pair => {
                    const [lon, lat] = pair.trim().split(/\s+/).map(Number);
                    return [lon, lat];
                });
                return {
                    type: 'LineString',
                    coordinates: points
                };
            }
        }

        // POLYGON
        if (wkt.startsWith('POLYGON')) {
            const coords = wkt.match(/POLYGON\s*\(\(([^)]+)\)\)/i);
            if (coords) {
                const points = coords[1].split(',').map(pair => {
                    const [lon, lat] = pair.trim().split(/\s+/).map(Number);
                    return [lon, lat];
                });
                return {
                    type: 'Polygon',
                    coordinates: [points]
                };
            }
        }

        // MULTILINESTRING (common for roads)
        if (wkt.startsWith('MULTILINESTRING')) {
            const match = wkt.match(/MULTILINESTRING\s*\((.+)\)/i);
            if (match) {
                const lineStrings = match[1].match(/\([^)]+\)/g);
                if (lineStrings) {
                    const coordinates = lineStrings.map(lineString => {
                        const coords = lineString.replace(/[()]/g, '');
                        return coords.split(',').map(pair => {
                            const [lon, lat] = pair.trim().split(/\s+/).map(Number);
                            return [lon, lat];
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
    parseWKTToGeoJSON
};
