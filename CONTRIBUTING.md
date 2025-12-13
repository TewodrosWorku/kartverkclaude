# Bidra til AV-Plan

Takk for at du vurderer å bidra til AV-Plan! Dette dokumentet inneholder retningslinjer for bidrag.

## Kodestil

### JavaScript
- Bruk ES6+ syntax (const, let, arrow functions, async/await)
- 4 spaces for innrykk
- Semicolons påkrevd
- camelCase for variabel- og funksjonsnavn
- PascalCase for klasser
- UPPER_CASE for konstanter

### Eksempel
```javascript
// God
const calculateDistance = (point1, point2) => {
    const distance = turf.distance(point1, point2);
    return distance;
};

// Dårlig
var calc_dist = function(p1,p2) {
return turf.distance(p1,p2)
}
```

### CSS
- Bruk CSS custom properties (variables)
- Mobile-first approach
- BEM-lignende navnekonvensjon
- Alfabetisk sortering av properties

### HTML
- Semantisk HTML5
- ARIA-labels for tilgjengelighet
- Norske tekster og attributter

## Commit-meldinger

Bruk klare, beskrivende commit-meldinger:

```
feat: Legg til eksport med målestokk
fix: Rett WKT-parsing for MULTILINESTRING
docs: Oppdater brukerveiledning
style: Forbedre knappestiler
refactor: Optimaliser distance marker-generering
test: Legg til tester for NVDB API
```

Prefixes:
- `feat`: Ny funksjonalitet
- `fix`: Bugfix
- `docs`: Dokumentasjon
- `style`: Formatering, ingen kodeendring
- `refactor`: Refaktorering
- `test`: Testing
- `chore`: Vedlikehold

## Pull Request-prosess

1. Fork prosjektet
2. Lag en feature branch (`git checkout -b feat/amazing-feature`)
3. Commit endringene (`git commit -m 'feat: Add amazing feature'`)
4. Push til branchen (`git push origin feat/amazing-feature`)
5. Åpne en Pull Request

### PR-sjekkliste
- [ ] Koden følger prosjektets kodestil
- [ ] Har lagt til/oppdatert dokumentasjon
- [ ] Har testet endringene lokalt
- [ ] Ingen console.error i produksjonskode
- [ ] Norske tekster i UI

## Testing

Før du sender inn PR:

1. Åpne `test/validation.html` i nettleseren
2. Sjekk at alle tester passerer
3. Test manuelt i flere nettlesere:
   - Chrome
   - Firefox
   - Safari (hvis mulig)
   - Edge

### Manuell testkjøring
- [ ] Søk etter vei
- [ ] Plasser arbeidssone
- [ ] Plasser skilt
- [ ] Eksporter bilde
- [ ] Lagre/laste prosjekt

## Nye funksjoner

Når du legger til nye funksjoner:

1. Diskuter først i et Issue
2. Beskriv use case
3. Vurder impact på eksisterende features
4. Legg til dokumentasjon
5. Legg til tester hvis mulig

## Rapportere bugs

Bruk GitHub Issues med følgende informasjon:

```
**Beskrivelse:**
Kort beskrivelse av problemet

**Steg for å reprodusere:**
1. Gå til...
2. Klikk på...
3. Se feil

**Forventet oppførsel:**
Hva burde skjedd

**Faktisk oppførsel:**
Hva skjedde

**Miljø:**
- Nettleser: Chrome 120
- OS: Windows 11
- AV-Plan versjon: 1.0.0

**Screenshots:**
Hvis aktuelt
```

## Kodegjennomgang

All kode vil bli gjennomgått før merge. Vær forberedt på:

- Konstruktiv feedback
- Forespørsler om endringer
- Diskusjon om implementasjon

## Lisens

Ved å bidra aksepterer du at dine bidrag lisenseres under samme lisens som prosjektet.

## Spørsmål?

Hvis du har spørsmål, åpne et Issue eller kontakt vedlikeholderne.

## Takk!

Alle bidrag, store som små, setter vi pris på!
