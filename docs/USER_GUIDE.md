# AV-Plan Brukerveiledning

## Innholdsfortegnelse

1. [Introduksjon](#introduksjon)
2. [Komme i gang](#komme-i-gang)
3. [Søke etter vei](#søke-etter-vei)
4. [Sette arbeidssone](#sette-arbeidssone)
5. [Plassere skilt](#plassere-skilt)
6. [Eksportere plan](#eksportere-plan)
7. [Lagre og laste prosjekter](#lagre-og-laste-prosjekter)
8. [Feilsøking](#feilsøking)
9. [Tips og triks](#tips-og-triks)

## Introduksjon

AV-Plan er et webbasert verktøy for å lage arbeidsvarslingsplaner for norske veier. Verktøyet lar deg:

- Velge vei fra NVDB (Nasjonal vegdatabank)
- Definere arbeidssoner med start- og sluttpunkt
- Se automatiske avstandsmarkører hver 20m og 50m
- Plassere trafikkskilt på kartet
- Eksportere ferdig plan som bilde
- Lagre og gjenbruke prosjekter

## Komme i gang

### Krav
- Moderne nettleser (Chrome, Firefox, Safari, Edge)
- Internettforbindelse
- Ingen installasjon nødvendig

### Åpne AV-Plan
1. Åpne `index.html` i nettleseren
2. Vent til kartet lastes
3. Du er klar til å starte!

## Søke etter vei

### Metode 1: Adressesøk
1. Skriv inn adresse eller stedsnavn i søkefeltet (minst 3 tegn)
2. Vent på forslagslisten (autocomplete)
3. Velg fra forslagslisten
4. Kartet zoomer til valgt sted med en rød markør
5. Klikk på veien for å velge den

### Metode 2: Klikk direkte på kartet
1. Zoom inn til ønsket vei
2. Klikk direkte på veien
3. Veiinformasjon vises i popup

### Veiinformasjon
Når en vei er valgt, vises:
- Vegreferanse (f.eks. "Ev6", "Rv3")
- Kommune
- Geometri

## Sette arbeidssone

### Sette START-punkt
1. Klikk på "Sett START"-knappen
2. Klikk på kartet der arbeidet starter
3. En grønn markør plasseres

### Sette SLUTT-punkt
1. Klikk på "Sett SLUTT"-knappen
2. Klikk på kartet der arbeidet slutter
3. En rød markør plasseres

### Avstandsmarkører
Når begge markører er satt, vises automatisk:
- **Små røde prikker**: hver 20 meter
- **Store røde prikker**: hver 50 meter
- Fra START: går BAKOVER opptil 400m
- Fra SLUTT: går FREMOVER opptil 400m

### Flytte markører
- Dra markørene for å justere posisjon
- Avstandsmarkører oppdateres automatisk

### Fjerne arbeidssone
Klikk "Fjern arbeidssone" for å slette begge markører

## Plassere skilt

### Velge skilt
1. Gå til "Skilt"-fanen
2. Bla gjennom tilgjengelige skilt:
   - **Fartsgrenser**: 30, 40, 50, 60, 70, 80, 90, 110 km/t
   - **Varslingsskilt**: Arbeid på vegen, Farlig vegkant, Ukjent fare
   - **Forbudsskilt**: Forbikjøring forbudt, Innkjøring forbudt

### Plassere skilt på kart
1. Dra skiltet fra paletten
2. Slipp på ønsket posisjon på kartet
3. Skiltet plasseres (kan festes til vei hvis snapping er på)

### Justere skilt
Klikk på plassert skilt for å:
- **Roter 90°**: Roterer skiltet i 90-graders intervaller
- **Fjern**: Sletter skiltet fra kartet

### Flytte skilt
Dra skiltet til ny posisjon

## Eksportere plan

### Eksportere som bilde
1. Klikk "Eksporter som bilde"-knappen
2. Vent mens bildet genereres
3. Bildet lastes ned automatisk som PNG

### Hva inkluderes?
- Kartutsnitt med arbeidssone
- Alle plasserte skilt
- Valgt vei (blå linje)
- Start- og slutt-markører
- Målestokk (automatisk generert)

### Hva skjules?
- Sidebar og kontroller
- Avstandsmarkører (kan vises/skjules)
- Zoom-kontroller

## Lagre og laste prosjekter

### Lagre prosjekt
1. Klikk "Lagre prosjekt"
2. Skriv inn prosjektnavn
3. Prosjektet lagres i nettleseren (localStorage)

### Laste prosjekt
1. Gå til "Prosjekter"-fanen
2. Klikk "Åpne" på ønsket prosjekt
3. Alt gjenopprettes:
   - Valgt vei
   - Arbeidssone
   - Plasserte skilt
   - Kartutsnittet

### Duplisere prosjekt
Klikk "Dupliser" for å lage en kopi av prosjektet

### Slette prosjekt
Klikk "Slett" og bekreft sletting

### Nytt prosjekt
Klikk "Nytt prosjekt" for å starte på nytt

## Innstillinger

### Fest til vei (Snapping)
- **På**: Markører og skilt festes automatisk til valgt vei
- **Av**: Fri plassering hvor som helst på kartet

### Vis avstandsmarkører
- **På**: Markører vises
- **Av**: Markører skjules (f.eks. for enklere eksport)

## Feilsøking

### "Ingen vei funnet her"
- Klikk nærmere veien
- Prøv å zoome inn mer
- Sjekk at du klikker på en registrert vei

### Adressesøk fungerer ikke
- Sjekk internettforbindelse
- Prøv enklere søkeord
- Sjekk at du skriver minst 3 tegn

### Avstandsmarkører vises ikke
- Sjekk at både START og SLUTT er satt
- Sjekk at en vei er valgt
- Sjekk at innstillingen er på

### Eksport feiler
- Sjekk at du har en vei valgt
- Prøv å zoome ut litt
- Vent litt og prøv igjen

### Kan ikke lagre prosjekt
- Sjekk at localStorage ikke er fullt
- Slett gamle prosjekter
- Sjekk at nettleserens lagringsmodus er aktivert

## Tips og triks

### Hurtigtaster
- **Ctrl/Cmd + S**: Lagre prosjekt
- **Ctrl/Cmd + E**: Eksporter
- **Ctrl/Cmd + N**: Nytt prosjekt
- **Escape**: Avbryt modus

### Best practice
1. Søk først opp området
2. Velg vei ved å klikke
3. Sett START, deretter SLUTT
4. Plasser skilt
5. Lagre prosjekt
6. Eksporter til bilde

### Før eksport
- Zoom til ønsket utsnittsområde
- Sjekk at alle skilt er riktig plassert
- Vurder å skjule avstandsmarkører hvis ikke nødvendig
- Kontroller at målestokken blir riktig

### Nøyaktighet
- Zoom inn for mer nøyaktig plassering
- Bruk snapping for å følge veien
- Sjekk avstandsmarkørene

## Kontakt og support

For spørsmål eller problemer:
- Sjekk denne brukerveiledningen
- Se dokumentasjonen i `docs/`
- Rapporter feil på GitHub

## Lisens og data

Data fra:
- **NVDB**: Nasjonal vegdatabank (NLOD-lisens)
- **Kartverket**: Topografiske kart
- **Geonorge**: Adressedata

Verktøyet er gratis å bruke.
