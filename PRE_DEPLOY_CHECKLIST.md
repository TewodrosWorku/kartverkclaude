# Pre-Deployment Checklist for AV-Plan

Bruk denne sjekklisten før deployment til produksjon.

## Kodekvalitet
- [ ] Alle ESLint-feil er fikset
- [ ] Ingen console.error i produksjonskode
- [ ] Alle TODO-er er løst eller dokumentert
- [ ] Kode er kommentert der nødvendig

## Testing
- [ ] Manuell testing fullført
- [ ] Alle valideringstester passerer (`test/validation.html`)
- [ ] Testet på Chrome
- [ ] Testet på Firefox
- [ ] Testet på Safari (hvis mulig)
- [ ] Testet på Edge
- [ ] Testet på mobile enheter
- [ ] NVDB API V4-kall verifisert

## Funksjoner
- [ ] Adressesøk fungerer
- [ ] Veivalg fungerer
- [ ] Arbeidssone kan settes
- [ ] Avstandsmarkører genereres korrekt
- [ ] Skilt kan plasseres og roteres
- [ ] Eksport til PNG fungerer
- [ ] Målestokk vises korrekt i eksport
- [ ] Prosjekt kan lagres
- [ ] Prosjekt kan lastes
- [ ] Prosjekt kan slettes

## Assets
- [ ] Alle SVG-skilt er tilstede i `assets/signs/`
- [ ] `sign-library.json` er komplett
- [ ] Bilder er optimalisert
- [ ] Ingen ødelagte lenker

## Konfigurasjon
- [ ] API-URL-er er korrekte (produksjonsendepunkter)
- [ ] Ingen development/debugging-kode
- [ ] Feilmeldinger er brukervennlige (på norsk)
- [ ] Norsk tekst er korrekt

## Dokumentasjon
- [ ] README.md er oppdatert
- [ ] Brukerveiledning er komplett
- [ ] API-dokumentasjon er nøyaktig
- [ ] CONTRIBUTING.md er oppdatert

## Ytelse
- [ ] Sideinnlasting < 3 sekunder
- [ ] Kart rendres jevnt
- [ ] Eksport fullføres < 5 sekunder
- [ ] Ingen minnelekkasjer

## Sikkerhet
- [ ] Ingen API-nøkler i koden
- [ ] localStorage-data valideres
- [ ] XSS-beskyttelse på plass
- [ ] Eksterne lenker validert

## Juridisk
- [ ] NVDB-attribusjon er til stede
- [ ] Kartverket-attribusjon er til stede
- [ ] Geonorge-attribusjon er til stede
- [ ] Lisensfil inkludert

## Nettleserkompatibilitet
- [ ] ES6+ features brukes korrekt
- [ ] Polyfills hvis nødvendig
- [ ] Graceful degradation
- [ ] Mobile viewport korrekt

## Deployment
- [ ] `.gitignore` er korrekt
- [ ] Ingen sensitive filer commitet
- [ ] Build-prosess fungerer (hvis aktuelt)
- [ ] Deployment-konfigurasjon testet

## Post-Deployment
- [ ] Verify production URL fungerer
- [ ] Test alle funksjoner i produksjon
- [ ] Sjekk console for errors
- [ ] Verify API-kall fungerer
- [ ] Monitor ytelse

---

## Når alt er sjekket:

✅ **Klar til deployment!**

## Deployment-kommandoer

### GitHub Pages
```bash
git add .
git commit -m "Deploy: $(date +'%Y-%m-%d %H:%M')"
git push origin master
```

### Netlify
```bash
# Drag-and-drop i Netlify UI
# eller bruk Netlify CLI:
netlify deploy --prod
```

### Vercel
```bash
vercel --prod
```

---

**Dato:** _________________

**Utført av:** _________________

**Signatur:** _________________
