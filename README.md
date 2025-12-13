# AV-Plan - Arbeidsvarslingsplan for norske veier

Et webbasert verktøy for å lage arbeidsvarslingsplaner for norske veier. Integrasjon med NVDB, Kartverket og Geonorge.

## 🚀 Kom i gang

### Forutsetninger
- Moderne nettleser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Internettforbindelse (for kart og veidata)
- Ingen installasjon nødvendig

### Bruk
1. Åpne `index.html` i nettleseren
2. Søk etter adresse eller klikk på kartet for å velge vei
3. Sett start og slutt for arbeidssone
4. Dra trafikkskilt til kartet
5. Eksporter som bilde
6. Lagre prosjekt i nettleseren

## 📋 Funksjoner

- **Kartvisning**: Norske topografiske kart fra Kartverket
- **Veivalg**: Klikk på vei for å velge (NVDB API V4)
- **Adressesøk**: Søk etter adresse eller sted (Geonorge)
- **Arbeidssone**: Sett start og slutt for arbeidsområde
- **Avstandsmarkører**: Automatiske markører hver 20m og 50m
- **Trafikkskilt**: Dra og slipp skilt på kartet
- **Eksport**: Last ned plan som bilde
- **Prosjektlagring**: Lagre og last inn prosjekter (localStorage)

## 🛠️ Teknologi

### Arkitektur
- 100% frontend (ingen backend)
- Vanilla JavaScript (ES6 modules)
- Ingen byggeprosess nødvendig

### API-er og datakilder
- **NVDB API Les V4**: Veinettdata og vegreferanser
  - https://nvdbapiles.atlas.vegvesen.no
- **Geonorge**: Adressesøk og geokoding
  - https://ws.geonorge.no/adresser/v1/sok
- **Kartverket**: Topografiske kartfliser
  - https://cache.kartverket.no/v1/wmts/

### Biblioteker (CDN)
- Leaflet 1.9.4 - Kartvisning
- Turf.js 6.x - Geografiske beregninger
- html2canvas 1.4.1 - Eksport til bilde

## 📁 Filstruktur

```
avplan/
├── index.html          # Hovedside
├── css/
│   ├── main.css        # Hovedstiler
│   └── components.css  # Komponentstiler
├── js/
│   ├── app.js          # Hovedapplikasjon
│   ├── nvdb-api.js     # NVDB API-integrasjon
│   ├── map-manager.js  # Karthåndtering
│   ├── address-search.js
│   ├── work-zone.js
│   ├── distance-markers.js
│   ├── sign-manager.js
│   ├── export.js
│   └── project-manager.js
├── assets/signs/       # Trafikkskilt (SVG)
│   ├── speed/
│   ├── warning/
│   └── prohibition/
└── data/
    └── sign-library.json
```

## 📝 Lisens

Data fra NVDB er tilgjengelig under NLOD (Norsk lisens for offentlige data).

## 🧪 Testing

Åpne `test/validation.html` for å kjøre valideringstester.
