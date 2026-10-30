# SV Aufheim E2 · Team-Dashboard

Ein mobiles, inoffizielles Fan-Dashboard für die Saison 2026/27. Es enthält die Tabelle der E-Junioren Qualifikationsstaffel 22, Teamstatistiken, Ergebnisse, nächste Spiele und eine separate Liveticker-Seite.

## Kostenlos auf GitHub Pages veröffentlichen

Die öffentliche Teamseite benötigt keinen Build-Prozess. Der Liveticker nutzt optional Firebase Realtime Database:

- `index.html`
- `styles.css`
- `app.js`
- `data.js`
- `logo.png` (vom Nutzer bereitgestelltes Vereinswappen)
- `sponsor-bolzano.jpg` (vom Nutzer bereitgestelltes Sponsorbild, unten rechts)
- `ticker.html`, `ticker.css`, `ticker.js`, `firebase-config.js` (Liveticker)
- `.github/workflows/update-data.yml` und `scripts/update_fussball.py` (automatischer Abgleich)

1. In GitHub ein neues **öffentliches** Repository namens `sv-aufheim-e2` erstellen.
2. Die Dateien direkt ins Stammverzeichnis (`/`) des Repositorys hochladen bzw. committen. Diese README ist optional, aber hilfreich.
3. Im Repository `Settings` → `Pages` öffnen.
4. Unter `Build and deployment` → `Source: Deploy from a branch` wählen, `Branch: main` und Ordner `/(root)` einstellen, dann `Save`.
5. Nach der Veröffentlichung lautet die Adresse üblicherweise `https://DEIN-GITHUB-NAME.github.io/sv-aufheim-e2/`. GitHub zeigt den genauen Link unter `Settings` → `Pages`.

Danach kann der Link auf WhatsApp geteilt oder als QR-Code gedruckt werden. Die GitHub-Pages-Subdomain ist kostenlos; eine eigene Domain ist nicht erforderlich.

## Automatische Aktualisierung der Tabelle

Die GitHub Action `SV Aufheim E2 – Tabellenabgleich` versucht dreimal täglich, die öffentlich sichtbare Tabelle und den Spielplan abzurufen. Sie überprüft Größe und Plausibilität der Daten. **Bei einem Abruf- oder Formatfehler bleiben die letzten gültigen Daten unverändert.** Änderungen werden als Commit an `data.js` gesendet; GitHub Pages veröffentlicht diesen automatisch.

Du kannst unter **Actions → SV Aufheim E2 – Tabellenabgleich → Run workflow** einen zusätzlichen manuellen Abruf auslösen. Wenn der Workflow keine Schreibrechte hat, unter **Settings → Actions → General → Workflow permissions** die notwendigen Berechtigungen prüfen.

FUSSBALL.DE gibt einzelne Spielergebnisse in einer speziellen verschleierten Darstellung aus. Der Importer umgeht diese Darstellung **nicht**. Den exakten Spielstand eines neuen Spiels berechnet er nur dann aus den offiziellen Tabellenstatistiken, wenn zweifelsfrei genau ein weiteres Spiel dazugekommen ist und die Zahlen konsistent sind. Sonst aktualisiert er nur die verifizierbare Tabelle; unbekannte Ergebnisse bleiben unverändert. Die Daten sind also **kein Sekunden-Liveticker**. Bitte die jeweiligen Nutzungsbedingungen der Datenquelle beachten.

Alternativ kannst du weiterhin `data.js` bearbeiten und die Änderungen committen.

- `updated` / `updatedLabel`: Datum der letzten Überprüfung
- `standings`: Tabelle, Spiele, Tore und Punkte
- `nextMatch`: nächster Spieltermin
- `results`: Ergebnisse der Mannschaft; bei nicht verifiziertem Spielstand `score: null` lassen

Die Daten stammen aus der [offiziellen Mannschaftsseite](https://www.fussball.de/mannschaft/sgm-sv-aufheim-ii-ah-sv-aufheim-wuerttemberg/-/saison/2627/team-id/031BOECLT4000000VS5489BRVTPI24NQ).

## Live-Ticker für Eltern / Trainer

Die zweite Seite heißt **`ticker.html`** und ist öffentlich lesbar. Wer vor Ort ist, kann sich über Google anmelden und – nach Freischaltung durch einen Administrator – Tore, Anpfiff, Halbzeit, Abpfiff und kurze Spielereignisse eintragen. Alle Zuschauer erhalten neue Meldungen in Echtzeit, ohne die Seite neu laden zu müssen.

**Einmalige Einrichtung:** Siehe [FIREBASE_SETUP.md](FIREBASE_SETUP.md). Solange Firebase nicht eingerichtet ist, zeigt die Seite einen ehrlichen Einrichtungshinweis; sie behauptet keine funktionierende Live-Verbindung.

## Alternative: Offizielle Datenpflege mit dem Widget

FUSSBALL.DE bietet eine offizielle Tabellen- und Spielplan-Einbindung für nicht kommerzielle Vereinswebseiten an. Für das Widget muss die endgültige Website-Domain registriert werden; erst danach erhält man einen auf die Domain beschränkten Einbindungscode.

1. Bei [next.fussball.de](https://next.fussball.de) anmelden.
2. Im Profil `Meine Widgets` öffnen und die E-Junioren Qualifikationsstaffel 22 wählen.
3. Nach Prüfung der Nutzungsbedingungen die GitHub-Pages-Adresse als Ziel-Domain angeben.
4. Den erzeugten Embed-Code in einen geeigneten HTML-Bereich der Webseite einfügen.

Das offizielle Widget aktualisiert seine Inhalte selbst. Die **individualisierte Tabelle in diesem Dashboard** ist davon unabhängig und wird durch den oben beschriebenen GitHub-Workflow aktualisiert. Die Nutzung des Widgets außerhalb einer Vereinswebseite sollte anhand der aktuellen Anbieterbedingungen geprüft werden.

Mehr Infos: [FUSSBALL.DE – Widgets für Webmaster](https://www.fussball.de/newsdetail/so-baue-ich-widgets-ein-tipps-fuer-webmaster/-/article-id/130660).

## Hinweise

- Keine Namen, Bilder oder personenbezogenen Daten von Kindern enthalten.
- Das Vereinswappen wurde vom Nutzer bereitgestellt und wird in `logo.png` eingebunden. Vor öffentlicher Nutzung bitte sicherstellen, dass die Verwendung durch den Verein erlaubt ist.
- Die Seite lädt keine externen Schriften und verwendet Systemschriften.
- Die normale Teamseite verwendet keine Cookies oder Analytics. Der Liveticker braucht nach der Einrichtung Firebase Auth und Realtime Database; für den Google-Login gelten deren Datenschutzbestimmungen.
