# Haushaltslager

Lokale Web-App zum Erfassen und Verwalten von Lebensmittelvorräten.

## Funktionen

- Einkauf per Barcode-Eingabe oder Kamera-Scan erfassen
- Produkt, Menge, Einheit, Lagerort, MHD, Preis und Mindestbestand speichern
- Bestand nach Lagerort verwalten und Entnahmen buchen
- Hinweise bei niedrigem Bestand, leerem Bestand und nahem MHD
- Preisverlauf und Preisalarm auf Basis der erfassten Einkaufspreise
- Jahresauswertung für Verbrauch und Ausgaben
- Einkaufsliste aus Mindestbeständen
- JSON-Import und -Export
- Produktdaten und Bilder per Barcode über Open Food Facts
- PWA: installierbar auf Smartphone, Tablet und Desktop

## Start

```bash
npm start
```

Dann im Browser öffnen:

```text
http://127.0.0.1:4173
```

Die Daten bleiben lokal im Browser über `localStorage`. Kamera-Scan und Browser-Benachrichtigungen funktionieren am zuverlässigsten über `localhost`.

## Deployment auf Render

Die App ist als Render Web Service vorbereitet. Render liest `render.yaml` aus dem Repository und startet den Node-Server mit:

```text
npm install
npm start
```

In Render:

1. Repository zu GitHub/GitLab/Bitbucket pushen.
2. Render Dashboard öffnen.
3. New > Blueprint oder New > Web Service wählen.
4. Repository verbinden.
5. Render nutzt `render.yaml` oder setzt manuell:
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`

Nach dem Deploy bekommst du eine HTTPS-Adresse wie:

```text
https://haushaltslager.onrender.com
```

Diese Adresse kannst du auf Smartphone und Desktop als PWA installieren.

## Barcode-Daten und Bilder

Beim Scan fragt die App zuerst deinen lokalen Katalog ab. Wenn der Barcode dort noch nicht bekannt ist, nutzt sie Open Food Facts:

```text
https://world.openfoodfacts.org
```

Gefundene Produktnamen, Marken, Packungsgrößen und Produktbilder werden lokal gespeichert. Beim nächsten Scan funktioniert derselbe Artikel dadurch auch ohne erneute Online-Abfrage.

Nicht jeder Barcode ist garantiert vorhanden. Open Food Facts ist eine offene, community-gepflegte Datenbank. Aldi-, Lidl- oder Edeka-Produkte sind oft enthalten, aber Eigenmarken, neue Verpackungen oder regionale Produkte können fehlen. In dem Fall legst du den Artikel einmal manuell an; danach kennt deine App ihn lokal.

Wenn kein Produktbild vorhanden ist, zeigt die App automatisch einen Platzhalter. Du kannst zusätzlich manuell eine Bild-URL eintragen.

## Hinweis zu Preisen

Der aktuelle Preis entspricht dem zuletzt erfassten Einkaufspreis. Open Food Facts liefert Produktdaten, aber keine verlässlichen aktuellen Supermarktpreise. Preise für Lidl, Aldi oder Edeka müssen deshalb aktuell beim Einkauf erfasst werden.
