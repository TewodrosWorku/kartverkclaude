# Traffic Signs

This folder contains SVG symbols organized by SVV (Statens vegvesen) categories.

## Folder Structure

```
signs/
├── index.json                          # List of all sign files
├── fareskilt/                          # Danger signs
├── vikeplikt-og-forkjorsskilt/        # Yield and right-of-way signs
├── forbudsskilt/                       # Prohibition signs
├── pabudsskilt/                        # Mandatory signs
├── opplysningsskilt/                   # Information signs
├── serviceskilt/                       # Service signs
├── veivisningsskilt/                   # Direction signs
├── underskilt/                         # Supplementary signs
└── markeringsskilt/                    # Marking signs
```

## How to Add New Signs

1. **Choose the correct category folder**
2. **Place SVG file** in that folder (e.g., `fareskilt/trafikkjegle.svg`)
3. **Add to `index.json`** with folder path:
   ```json
   [
     "fareskilt/trafikkjegle.svg",
     "fareskilt/varseltavle.svg",
     "opplysningsskilt/gult-blinksignal.svg"
   ]
   ```
4. **Refresh the app** - Signs will appear grouped by category!

## Category Names

- **fareskilt** → displayed as "Fareskilt"
- **vikeplikt-og-forkjorsskilt** → "Vikeplikt-og-forkjorsskilt"
- **forbudsskilt** → "Forbudsskilt"
- **pabudsskilt** → "Pabudsskilt"
- **opplysningsskilt** → "Opplysningsskilt"
- **serviceskilt** → "Serviceskilt"
- **veivisningsskilt** → "Veivisningsskilt"
- **underskilt** → "Underskilt"
- **markeringsskilt** → "Markeringsskilt"

## Naming Convention

Use descriptive, lowercase Norwegian filenames with hyphens:
- `fareskilt/trafikkjegle.svg` → displays as "Trafikkjegle" under "Fareskilt"
- `opplysningsskilt/gult-blinksignal.svg` → displays as "Gult Blinksignal" under "Opplysningsskilt"
- `markeringsskilt/ledeskinne.svg` → displays as "Ledeskinne" under "Markeringsskilt"

## Extracting from tegnforklaring.svg

Use Inkscape or similar tool:
1. Open `tegnforklaring.svg` (in project root)
2. Select a symbol group
3. Export Selection → Save as individual SVG
4. Save to the appropriate category folder (e.g., `fareskilt/`)
5. Add the path to `index.json`

## SVG Requirements

- Viewbox should be set correctly
- Keep file size small
- Simple, clean paths work best
- No external dependencies
