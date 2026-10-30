# SV Aufheim E2 · Team-Dashboard

Ein mobiles, inoffizielles Fan-Dashboard für die Saison 2026/27. Es enthält die Tabelle der E-Junioren Qualifikationsstaffel 22, Teamstatistiken, die letzte Ergebnisübersicht und den laut Datenstand nächsten Spieltermin.

## Kostenlos auf GitHub Pages veröffentlichen

Die Webseite besteht nur aus vier Dateien und benötigt weder Build-Prozess noch Datenbank:

- `index.html`
- `styles.css`
- `app.js`
- `data.js`

1. In GitHub ein neues **öffentliches** Repository namens `sv-aufheim-e2` erstellen.
2. Die vier Dateien direkt ins Stammverzeichnis (`/`) des Repositorys hochladen bzw. committen. Diese README ist optional, aber hilfreich.
3. Im Repository `Settings` → `Pages` öffnen.
4. Unter `Build and deployment` → `Source: Deploy from a branch` wählen, `Branch: main` und Ordner `/(root)` einstellen, dann `Save`.
5. Nach der Veröffentlichung lautet die Adresse üblicherweise `https://DEIN-GITHUB-NAME.github.io/sv-aufheim-e2/`. GitHub zeigt den genauen Link unter `Settings` → `Pages`.

Danach kann der Link auf WhatsApp geteilt oder als QR-Code gedruckt werden. Die GitHub-Pages-Subdomain ist kostenlos; eine eigene Domain ist nicht erforderlich.

## Aktualisierung der Tabelle

**Wichtig:** In der vorliegenden Version sind die öffentlich sichtbaren Teamdaten eine **manuell gepflegte Momentaufnahme** vom 30.10.2026, vor dem Spiel in Pfaffenhofen. Die Seite ist **nicht** live mit FUSSBALL.DE synchronisiert. Nach zwei Tagen zeigt sie einen deutlichen Hinweis, dass die Angaben veraltet sein können.

Zum Aktualisieren nur `data.js` bearbeiten und die Änderungen auf GitHub committen. Die Seite wird automatisch neu veröffentlicht.

- `updated` / `updatedLabel`: Datum der letzten Überprüfung
- `standings`: Tabelle, Spiele, Tore und Punkte
- `nextMatch`: nächster Spieltermin
- `results`: Ergebnisse der Mannschaft; bei nicht verifiziertem Spielstand `score: null` lassen

Die Daten stammen aus der [offiziellen Mannschaftsseite](https://www.fussball.de/mannschaft/sgm-sv-aufheim-ii-ah-sv-aufheim-wuerttemberg/-/saison/2627/team-id/031BOECLT4000000VS5489BRVTPI24NQ).

## Automatische Datenpflege mit dem offiziellen Widget

FUSSBALL.DE bietet eine offizielle Tabellen- und Spielplan-Einbindung für nicht kommerzielle Vereinswebseiten an. Für das Widget muss die endgültige Website-Domain registriert werden; erst danach erhält man einen auf die Domain beschränkten Einbindungscode.

1. Bei [next.fussball.de](https://next.fussball.de) anmelden.
2. Im Profil `Meine Widgets` öffnen und die E-Junioren Qualifikationsstaffel 22 wählen.
3. Nach Prüfung der Nutzungsbedingungen die GitHub-Pages-Adresse als Ziel-Domain angeben.
4. Den erzeugten Embed-Code in einen geeigneten HTML-Bereich der Webseite einfügen.

Das offizielle Widget aktualisiert seine eigenen Inhalte. Die **individualisierte Tabelle in diesem Dashboard** bleibt dabei zunächst unabhängig und wird weiter über `data.js` gepflegt. Eine automatisierte Übernahme in die Spezialgestaltung ist **nicht** eingebaut. Die Nutzung des Widgets außerhalb einer Vereinswebseite, etwa auf einer privaten Elternseite, sollte anhand der aktuellen Anbieterbedingungen geklärt werden. Kein ungefragtes Scraping oder inoffizielle API-Abfragen.

Mehr Infos: [FUSSBALL.DE – Widgets für Webmaster](https://www.fussball.de/newsdetail/so-baue-ich-widgets-ein-tipps-fuer-webmaster/-/article-id/130660).

## Hinweise

- Keine Namen, Bilder oder personenbezogenen Daten von Kindern enthalten.
- Das `A`-Emblem ist ein eigens gestalteter Platzhalter, kein offizielles Vereinswappen.
- Die Seite lädt keine externen Schriften und verwendet Systemschriften.
- Keine Cookies, Analytics oder Backend-Dienste.
