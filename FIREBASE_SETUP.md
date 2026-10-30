# Kostenlosen E2-Liveticker aktivieren

Die Datei `ticker.html` ist bereits eine zweite Seite der GitHub-Pages-Website. Sie zeigt **erst dann echte Live-Daten**, wenn diese einmalig mit Firebase verbunden wird. GitHub Pages selbst kann keine Eingaben anderer Handys speichern.

## 1. Kostenloses Firebase-Projekt anlegen

1. Auf https://console.firebase.google.com/ ein neues Projekt `aufheim-e2-live` anlegen. Google Analytics kann deaktiviert bleiben.
2. Den **Spark-Plan (kostenlos)** wählen. Keine kostenpflichtigen Add-ons einschalten.
3. In den Projekteinstellungen eine **Web-App (`</>`)** anlegen. Hosting wird nicht benötigt (GitHub Pages hostet bereits die Seite).
4. Unter **Build → Realtime Database** eine Datenbank anlegen. Die Datenbank-URL kopieren (z. B. `https://...-default-rtdb.europe-west1.firebasedatabase.app`).
5. Unter **Authentication → Sign-in method** den Anbieter **Google** aktivieren. Unter **Authentication → Settings → Authorized domains** die Domain `christianh927.github.io` ergänzen. Je nach Firebase-Version wird sie nicht automatisch freigeschaltet.

## 2. Konfiguration im Repository hinterlegen

In den Firebase-Projekteinstellungen bei der registrierten Web-App findest du ein Objekt `firebaseConfig`. Trage dieses in `firebase-config.js` statt `null` ein:

```js
export const FIREBASE_CONFIG = {
  apiKey: "DEIN_FIREBASE_WEB_API_KEY",
  authDomain: "DEIN_PROJEKT.firebaseapp.com",
  databaseURL: "https://DEIN_PROJEKT-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "DEIN_PROJEKT",
  appId: "DEINE_APP_ID"
};
```

Diese **Web-Konfiguration ist öffentlich**, kein Admin-Schlüssel. Firebase-Sicherheitsregeln schützen Schreibzugriffe. Bitte **keine Service-Account-JSON-Dateien oder Admin-Credentials ins Repository** laden.

## 3. Nur freigeschaltete Reporter dürfen schreiben

In **Realtime Database → Rules** folgende Regeln eintragen und veröffentlichen:

```json
{
  "rules": {
    "live": {
      "current": {
        ".read": true,
        ".write": "auth != null && root.child('reporters').child(auth.uid).val() === true",
        ".validate": "newData.hasChildren(['home', 'away', 'homeScore', 'awayScore', 'status', 'createdAt', 'updatedAt']) && newData.child('home').isString() && newData.child('away').isString() && newData.child('homeScore').isNumber() && newData.child('awayScore').isNumber() && newData.child('homeScore').val() >= 0 && newData.child('awayScore').val() >= 0"
      }
    },
    "reporters": {
      ".read": false,
      ".write": false
    }
  }
}
```

**Reporter freischalten:**

1. `https://christianh927.github.io/sv-aufheim-e2/ticker.html` öffnen und auf **Mit Google anmelden** tippen.
2. Nach dem Login zeigt der Reportermodus die persönliche **UID** an. Diese kopieren.
3. In Firebase unter **Realtime Database → Data** einen Knoten `reporters` anlegen. Darunter einen Eintrag mit **Schlüssel = UID**, **Wert = Boolean `true`** erstellen. Die Admin-Konsole darf diese Regeln verwalten; normale Besucher können sie nicht ändern.
4. Für jeden weiteren Elternteil oder Trainer mit Schreibberechtigung wiederholen.

## 4. Live testen

- Auf Handy A als Reporter anmelden und ein neues Spiel anlegen.
- Auf Handy B (ohne Anmeldung) die Seite `ticker.html` öffnen.
- Auf Handy A auf **Anpfiff** oder **Tor Aufheim +1** tippen. Auf Handy B muss das Ergebnis ohne Neuladen erscheinen.
- Über **Letztes Ereignis rückgängig** kann ein Tippfehler korrigiert werden.

Wichtig: Reporter dürfen keine Spielernamen, Fotos oder sonstige personenbezogene Angaben zu Kindern eintragen. Der Liveticker ist inoffiziell; die offizielle Tabelle kommt weiterhin von FUSSBALL.DE.
