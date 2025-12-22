/**
 * Tile Proxy Server for Kartverket
 * Proxies tile requests and adds CORS headers to allow canvas export
 */

const express = require('express');
const https = require('https');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all requests
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'kartverket-tile-proxy' });
});

// Tile proxy endpoint: /tiles/{layer}/{z}/{x}/{y}.png
// Example: /tiles/topo/10/512/256.png
app.get('/tiles/:layer/:z/:x/:y.png', async (req, res) => {
    const { layer, z, x, y } = req.params;

    // Validate layer (only allow known Kartverket layers)
    const allowedLayers = ['topo', 'norges_grunnkart', 'sjokartraster'];
    if (!allowedLayers.includes(layer)) {
        return res.status(400).json({ error: 'Invalid layer' });
    }

    // Construct Kartverket URL
    const kartverketUrl = `https://cache.kartverket.no/v1/wmts/1.0.0/${layer}/default/webmercator/${z}/${y}/${x}.png`;

    console.log(`[${new Date().toISOString()}] Proxying: ${kartverketUrl}`);

    try {
        // Fetch tile from Kartverket
        https.get(kartverketUrl, (kartverketRes) => {
            // Forward status code
            res.status(kartverketRes.statusCode);

            // Forward relevant headers
            if (kartverketRes.headers['content-type']) {
                res.setHeader('Content-Type', kartverketRes.headers['content-type']);
            }
            if (kartverketRes.headers['cache-control']) {
                res.setHeader('Cache-Control', kartverketRes.headers['cache-control']);
            } else {
                // Cache tiles for 1 day
                res.setHeader('Cache-Control', 'public, max-age=86400');
            }

            // Stream the response
            kartverketRes.pipe(res);

        }).on('error', (err) => {
            console.error(`[${new Date().toISOString()}] Error fetching tile:`, err.message);
            res.status(502).json({ error: 'Failed to fetch tile from Kartverket' });
        });

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Proxy error:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Alternative endpoint with different URL structure: /tiles/{z}/{y}/{x}.png (defaults to topo)
app.get('/tiles/:z/:y/:x.png', async (req, res) => {
    const { z, y, x } = req.params;

    // Default to topo layer
    const kartverketUrl = `https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/${z}/${y}/${x}.png`;

    console.log(`[${new Date().toISOString()}] Proxying (topo default): ${kartverketUrl}`);

    try {
        https.get(kartverketUrl, (kartverketRes) => {
            res.status(kartverketRes.statusCode);

            if (kartverketRes.headers['content-type']) {
                res.setHeader('Content-Type', kartverketRes.headers['content-type']);
            }
            if (kartverketRes.headers['cache-control']) {
                res.setHeader('Cache-Control', kartverketRes.headers['cache-control']);
            } else {
                res.setHeader('Cache-Control', 'public, max-age=86400');
            }

            kartverketRes.pipe(res);

        }).on('error', (err) => {
            console.error(`[${new Date().toISOString()}] Error fetching tile:`, err.message);
            res.status(502).json({ error: 'Failed to fetch tile from Kartverket' });
        });

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Proxy error:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server (for local development)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`===========================================`);
        console.log(`Kartverket Tile Proxy Server`);
        console.log(`===========================================`);
        console.log(`Port: ${PORT}`);
        console.log(`Health check: http://localhost:${PORT}/health`);
        console.log(`Tile endpoint: http://localhost:${PORT}/tiles/{z}/{y}/{x}.png`);
        console.log(`===========================================`);
    });
}

// Export for Vercel serverless deployment
module.exports = app;
