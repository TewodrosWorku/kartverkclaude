/**
 * Extract SVG symbols from tegnforklaring.svg
 * Creates individual SVG files and updates sign-library.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the source SVG
const svgContent = fs.readFileSync('tegnforklaring.svg', 'utf8');

// Symbol definitions with their approximate Y positions and names
const symbols = [
    { y: 3400, name: 'Trafikkskilt (ensidig)', id: 'traffic-sign-one-sided', category: 'signs' },
    { y: 4500, name: 'Trafikkskilt (tosidig)', id: 'traffic-sign-two-sided', category: 'signs' },
    { y: 5500, name: 'Trafikkskilt (buet)', id: 'traffic-sign-curved', category: 'signs' },
    { y: 6500, name: 'Trafikkskilt (tavle)', id: 'traffic-sign-board', category: 'signs' },
    { y: 7500, name: 'Trafikkskilt (bakgrunn)', id: 'traffic-sign-background', category: 'signs' },
    { y: 8500, name: 'Trafikkskilt (hinder/ensidig)', id: 'traffic-sign-obstacle-one', category: 'signs' },
    { y: 9500, name: 'Trafikkskilt (hinder/tosidig)', id: 'traffic-sign-obstacle-two', category: 'signs' },
    { y: 10500, name: 'Ledeskinne', id: 'guide-rail', category: 'barriers' },
    { y: 11500, name: 'Dobbeltsidig skilting', id: 'double-sided-marking', category: 'signs' },
    { y: 12500, name: 'Trafikkjegle', id: 'traffic-cone', category: 'equipment' },
    { y: 13500, name: 'Gult blinksignal', id: 'yellow-flashing-light', category: 'signals' },
    { y: 14500, name: 'Vekselvis blinkende signal', id: 'alternating-flashing-light', category: 'signals' },
    { y: 15500, name: 'Lyshode trafikksignal', id: 'traffic-signal-head', category: 'signals' },
    { y: 16500, name: 'Varseltavle', id: 'warning-board', category: 'equipment' },
    { y: 17500, name: 'Tversgående energiabsorber', id: 'transverse-barrier', category: 'barriers' },
    { y: 18500, name: 'Langsgående sikring', id: 'longitudinal-barrier', category: 'barriers' },
    { y: 19500, name: 'Sikring gående/syklende', id: 'pedestrian-barrier', category: 'barriers' },
    { y: 20500, name: 'Buffersone', id: 'buffer-zone', category: 'barriers' },
    { y: 21500, name: 'Deformasjonsbredde', id: 'deformation-width', category: 'barriers' },
    { y: 22500, name: 'Arbeidsområde', id: 'work-area', category: 'zones' },
    { y: 23500, name: 'Vegarbeider', id: 'road-worker', category: 'personnel' },
    { y: 24500, name: 'Trafikkdirigent', id: 'traffic-director', category: 'personnel' },
    { y: 25500, name: 'Bil med gult lys', id: 'vehicle-yellow-light', category: 'vehicles' },
    { y: 26500, name: 'Støtputebil (TMA)', id: 'impact-attenuator', category: 'vehicles' }
];

// Create output directories
const svgDir = path.join(__dirname, 'signs', 'svgs');
if (!fs.existsSync(svgDir)) {
    fs.mkdirSync(svgDir, { recursive: true });
}

// Extract each symbol
const library = {};
const tolerance = 500; // Y-position tolerance

symbols.forEach(symbol => {
    // Find groups near this Y position
    const yMin = symbol.y - tolerance;
    const yMax = symbol.y + tolerance;

    // Match pattern for groups in this Y range
    const groupPattern = new RegExp(
        `(<g class="Group">.*?<g class="com\\.sun\\.star\\.drawing\\..*?">.*?<g id="id\\d+">.*?<rect class="BoundingBox".*?y="${yMin}[^"]*".*?</g>.*?</g>.*?</g>)`,
        'gs'
    );

    const matches = svgContent.match(groupPattern);

    if (matches && matches.length > 0) {
        // Take the first match for this symbol
        const symbolContent = matches[0];

        // Extract bounding box to calculate viewBox
        const bboxMatch = symbolContent.match(/x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)"/);

        if (bboxMatch) {
            const [, x, y, width, height] = bboxMatch;
            const padding = 50;
            const viewBoxX = parseInt(x) - padding;
            const viewBoxY = parseInt(y) - padding;
            const viewBoxWidth = parseInt(width) + (padding * 2);
            const viewBoxHeight = parseInt(height) + (padding * 2);

            // Create standalone SVG
            const standaloneSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink"
     viewBox="${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}"
     width="100" height="100">
${symbolContent}
</svg>`;

            // Save SVG file
            const filename = `${symbol.id}.svg`;
            const filepath = path.join(svgDir, filename);
            fs.writeFileSync(filepath, standaloneSvg);

            // Add to library
            library[symbol.id] = {
                id: symbol.id,
                name: symbol.name,
                file: `signs/svgs/${filename}`,
                category: symbol.category
            };

            console.log(`✓ Extracted: ${symbol.name} -> ${filename}`);
        }
    } else {
        console.log(`✗ Could not find symbol for: ${symbol.name} at Y=${symbol.y}`);
    }
});

// Save library JSON
const libraryPath = path.join(__dirname, 'data', 'sign-library.json');
fs.writeFileSync(libraryPath, JSON.stringify(library, null, 2));

console.log(`\n✓ Created ${Object.keys(library).length} symbols`);
console.log(`✓ Library saved to: ${libraryPath}`);
