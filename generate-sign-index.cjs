/**
 * Generate sign index from trafikkskilt folder
 * Scans the Geonorge traffic sign symbols and creates index.json
 */

const fs = require('fs');
const path = require('path');

const SIGNS_DIR = './signs';
const TRAFIKKSKILT_DIR = path.join(SIGNS_DIR, 'trafikkskilt');
const OUTPUT_FILE = path.join(SIGNS_DIR, 'index.json');

/**
 * Scan markeringsskilt directory for polygons and lines
 * @returns {Array} Array of sign paths
 */
function scanMarkeringsskilt() {
    const signs = [];
    const categoryPath = path.join(SIGNS_DIR, 'markeringsskilt');

    if (!fs.existsSync(categoryPath)) {
        return signs;
    }

    const files = fs.readdirSync(categoryPath, { withFileTypes: true })
        .filter(dirent => dirent.isFile() && dirent.name.endsWith('.svg'))
        .map(dirent => `markeringsskilt/${dirent.name}`);

    signs.push(...files);
    console.log(`Found ${files.length} markeringsskilt`);
    return signs;
}

/**
 * Scan trafikkskilt directory for all SVG files
 * @returns {Array} Array of sign paths
 */
function scanTrafikkskilt() {
    const signs = [];

    if (!fs.existsSync(TRAFIKKSKILT_DIR)) {
        console.log('⚠ trafikkskilt directory not found');
        return signs;
    }

    // Read all folders in trafikkskilt/
    const folders = fs.readdirSync(TRAFIKKSKILT_DIR, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    console.log(`Found ${folders.length} sign folders in trafikkskilt/`);

    for (const folder of folders) {
        const folderPath = path.join(TRAFIKKSKILT_DIR, folder);

        // Extract sign code from folder name
        // Matches: "940", "102_2", "810_R", "810_V45", etc.
        const codeMatch = folder.match(/^(\d+(?:_(?:\d+|[A-Z]\d*))?)/)
        if (!codeMatch) {
            console.log(`⚠ Skipping folder (no code): ${folder}`);
            continue;
        }

        const signCode = codeMatch[1];

        // Look for the nested SVG file: [folder]/[code]/[code].svg
        const svgPath = path.join(folderPath, signCode, `${signCode}.svg`);

        if (fs.existsSync(svgPath)) {
            // Create relative path from signs/ directory
            const relativePath = path.relative(SIGNS_DIR, svgPath).replace(/\\/g, '/');
            signs.push(relativePath);
        } else {
            console.log(`⚠ SVG not found: ${svgPath}`);
        }
    }

    return signs;
}

/**
 * Main function
 */
function main() {
    console.log('🔍 Scanning signs directories (MVP: Markeringsskilt + Trafikkskilt only)...\n');

    const markeringsskilt = scanMarkeringsskilt();
    const trafikkskilt = scanTrafikkskilt();

    // Collect all signs - MVP version: only markeringsskilt and trafikkskilt
    const allSigns = [
        ...markeringsskilt,
        ...trafikkskilt
    ];

    // Remove duplicates
    const uniqueSigns = [...new Set(allSigns)];

    console.log(`\n📊 Summary:`);
    console.log(`   - Markeringsskilt: ${markeringsskilt.length}`);
    console.log(`   - Trafikkskilt: ${trafikkskilt.length}`);
    console.log(`   - Total unique signs: ${uniqueSigns.length}`);

    // Write to index.json
    const jsonContent = JSON.stringify(uniqueSigns, null, 2);
    fs.writeFileSync(OUTPUT_FILE, jsonContent, 'utf8');

    console.log(`\n✅ Generated ${OUTPUT_FILE}`);
    console.log(`   Total signs available: ${uniqueSigns.length}`);
    console.log(`\n💡 MVP: Markeringsskilt (polygons + lines) and Trafikkskilt included`);
}

// Run the script
main();
