# AV-Plan API Dokumentasjon

## Oversikt

Dette dokumentet beskriver alle JavaScript-moduler og deres funksjoner i AV-Plan.

## Moduler

### nvdb-api.js

NVDB API V4 integrasjonsmodul.

#### `findNearestRoad(lat, lon, maxDistance = 50)`

Finn nærmeste vei til et punkt. Bruker NVDB API V4 med bounding box-søk.

**Parametere:**
- `lat` (number): Breddegrad
- `lon` (number): Lengdegrad
- `maxDistance` (number): Maksimal avstand i meter (standard: 50)

**Returnerer:** `Promise<Object|null>` - Veiobjekt eller null

**Hvordan det fungerer:**
1. Oppretter en bounding box (kartutsnitt) rundt klikket punkt
2. Spør NVDB API V4 `/vegnett/veglenkesekvenser/segmentert` etter veier i området
3. Bruker Turf.js til å finne nærmeste vei til klikket punkt
4. Returnerer den nærmeste veien

**Eksempel:**
```javascript
const road = await findNearestRoad(63.4305, 10.3951, 50);
if (road) {
    console.log(road.veglenkesekvensid);
    console.log(road.vegsystemreferanse);
}
```

#### `getRoadDetails(veglenkesekvensid)`

Hent detaljert veiinformasjon.

**Parametere:**
- `veglenkesekvensid` (string): Veilenke-ID fra NVDB

**Returnerer:** `Promise<Object|null>` - Full veidata med geometri

#### `formatRoadReference(vegsystemreferanse)`

Formater veireferanse til lesbart format.

**Parametere:**
- `vegsystemreferanse` (Object): Vegsystemreferanse fra NVDB

**Returnerer:** `string` - Formatert veireferanse (f.eks. "Ev6")

#### `parseWKTToGeoJSON(wkt)`

Konverter WKT-geometri til GeoJSON.

**Parametere:**
- `wkt` (string): WKT-geometristreng

**Returnerer:** `Object|null` - GeoJSON-geometriobjekt

---

### map-manager.js

Karthåndteringsmodul med Leaflet.

#### `initializeMap()`

Initialiser Leaflet-kartet.

**Returnerer:** `L.Map` - Leaflet-kartinstans

#### `setupMapClickHandler()`

Sett opp klikkhåndtering på kartet.

#### `selectRoadAtPoint(lat, lng)`

Velg vei på et punkt.

**Parametere:**
- `lat` (number): Breddegrad
- `lng` (number): Lengdegrad

#### `displayRoad(roadData, geojson)`

Vis vei på kartet.

**Parametere:**
- `roadData` (Object): Veidata fra NVDB
- `geojson` (Object): GeoJSON-geometri

#### `clearSelectedRoad()`

Fjern valgt vei.

#### `getMap()`

Hent kartinstans.

**Returnerer:** `L.Map` - Kartinstans

#### `getSelectedRoad()`

Hent valgt vei.

**Returnerer:** `Object|null` - Valgt veidata

---

### address-search.js

Adressesøkemodul med Geonorge.

#### `initAddressSearch()`

Initialiser adressesøk.

---

### work-zone.js

Arbeidssonemodul med markører.

#### `initWorkZone()`

Initialiser arbeidssonesystem.

#### `placeStartMarker(latlng)`

Plasser startmarkør.

**Parametere:**
- `latlng` (L.LatLng): Posisjon

#### `placeEndMarker(latlng)`

Plasser sluttmarkør.

**Parametere:**
- `latlng` (L.LatLng): Posisjon

#### `clearWorkZone()`

Fjern arbeidssone.

#### `snapToRoad(latlng)`

Fest punkt til valgt vei.

**Parametere:**
- `latlng` (L.LatLng): Punkt å feste

**Returnerer:** `L.LatLng` - Festet punkt

#### `getWorkZone()`

Hent arbeidssone.

**Returnerer:** `Object|null` - Objekt med start og slutt

#### `toggleSnapping(enabled)`

Slå snapping av/på.

**Parametere:**
- `enabled` (boolean): Aktiver eller deaktiver

---

### distance-markers.js

Avstandsmarkørmodul.

#### `updateDistanceMarkers()`

Oppdater avstandsmarkører basert på arbeidssone.

#### `toggleDistanceMarkers(visible)`

Vis/skjul avstandsmarkører.

**Parametere:**
- `visible` (boolean): Vis eller skjul

#### `clearDistanceMarkers()`

Fjern alle avstandsmarkører.

#### `hideForExport()`

Skjul markører for eksport.

#### `showAfterExport()`

Vis markører etter eksport.

---

### sign-manager.js

Skiltbibliotek og håndtering.

#### `initSignManager()`

Initialiser skiltsystem.

**Returnerer:** `Promise<void>`

#### `placeSign(signId, latlng, rotation = 0)`

Plasser skilt på kartet.

**Parametere:**
- `signId` (string): Skilt-ID fra biblioteket
- `latlng` (L.LatLng): Posisjon
- `rotation` (number): Rotasjon i grader (standard: 0)

**Returnerer:** `Object|null` - Plassert skiltobjekt

#### `removeSign(markerId)`

Fjern plassert skilt.

**Parametere:**
- `markerId` (number): Leaflet-markør-ID

#### `rotateSign(markerId)`

Roter skilt 90 grader.

**Parametere:**
- `markerId` (number): Leaflet-markør-ID

#### `getPlacedSigns()`

Hent alle plasserte skilt.

**Returnerer:** `Array` - Array av skiltobjekter

#### `clearAllSigns()`

Fjern alle skilt.

#### `restoreSigns(signs)`

Gjenopprett skilt fra data.

**Parametere:**
- `signs` (Array): Array av skiltdata

---

### export.js

Eksportmodul med html2canvas.

#### `exportMapImage(filename = null)`

Eksporter kart som PNG.

**Parametere:**
- `filename` (string): Valgfritt filnavn (standard: autogenerert)

**Returnerer:** `Promise<void>`

---

### project-manager.js

Prosjekthåndtering med localStorage.

#### `saveProject(projectName, metadata = {})`

Lagre prosjekt.

**Parametere:**
- `projectName` (string): Prosjektnavn
- `metadata` (Object): Valgfri metadata

**Returnerer:** `Object|null` - Lagret prosjektobjekt

#### `loadProject(projectId)`

Last prosjekt.

**Parametere:**
- `projectId` (number): Prosjekt-ID

**Returnerer:** `boolean` - Suksess

#### `listProjects()`

List alle prosjekter.

**Returnerer:** `Array` - Array av prosjektsammendrag

#### `deleteProject(projectId)`

Slett prosjekt.

**Parametere:**
- `projectId` (number): Prosjekt-ID

**Returnerer:** `boolean` - Suksess

#### `duplicateProject(projectId)`

Dupliser prosjekt.

**Parametere:**
- `projectId` (number): Prosjekt-ID

**Returnerer:** `Object|null` - Nytt prosjektobjekt

#### `clearCurrentProject()`

Tøm nåværende prosjekt.

#### `isStorageAvailable()`

Sjekk localStorage-tilgjengelighet.

**Returnerer:** `boolean` - Tilgjengelig

#### `getCurrentProject()`

Hent nåværende prosjekt.

**Returnerer:** `Object|null` - Prosjektobjekt

---

### app.js

Hovedapplikasjonsmodul.

Ingen eksporterte funksjoner - entry point.

---

## Datastrukturer

### Prosjekt

```javascript
{
    id: number,
    name: string,
    created: ISO date string,
    modified: ISO date string,
    metadata: {
        preparer: string,
        company: string,
        contact: string,
        roadReference: Object
    },
    mapState: {
        center: [lat, lon],
        zoom: number
    },
    selectedRoad: {
        id: string,
        reference: Object,
        geometry: GeoJSON
    },
    workZone: {
        start: [lat, lon] | null,
        end: [lat, lon] | null
    },
    signs: Array,
    settings: {
        snapToRoad: boolean,
        showDistanceMarkers: boolean
    }
}
```

### Skiltobjekt

```javascript
{
    id: string,
    name: string,
    category: "speed" | "warning" | "prohibition",
    file: string,
    description: string,
    keywords: Array<string>,
    size: string,
    temporary: boolean,
    common: boolean
}
```

---

## Eksterne avhengigheter

- **Leaflet 1.9.4**: Kartvisning
- **Turf.js 6.x**: Geografiske beregninger
- **html2canvas 1.4.1**: Skjermbilde-eksport

## API-er

- **NVDB API V4**: https://nvdbapiles.atlas.vegvesen.no
- **Geonorge**: https://ws.geonorge.no/adresser/v1/sok
- **Kartverket**: https://cache.kartverket.no/v1/wmts/
