import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getDatabase, ref, onValue, push, runTransaction } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";
import { FIREBASE_CONFIG } from "./firebase-config.js";

const $ = (id) => document.getElementById(id);
const statusNames = { planned: "VOR DEM ANPFIFF", first: "1. HALBZEIT · LIVE", half: "HALBZEIT", second: "2. HALBZEIT · LIVE", finished: "ABPFIFF · ENDE" };
const eventNames = { start: "Anpfiff!", half: "Halbzeit", resume: "Die zweite Halbzeit läuft!", end: "Abpfiff!", "goal-us": "TOOOR FÜR AUFHEIM! ⚽", "goal-them": "Tor für den Gegner", note: "Vom Spielfeldrand" };
let currentMatch = null;
let currentUser = null;

function notice(message, type = "") {
  $("live-message").textContent = message;
  $("live-message").className = `live-message ${type}`;
}

function dateText(stamp) {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" }).format(new Date(stamp));
}

function render(match) {
  currentMatch = match;
  const active = match && (match.status === "first" || match.status === "second");
  $("match-status").textContent = match ? statusNames[match.status] || "SPIEL LÄUFT" : "KEIN SPIEL AKTIV";
  document.querySelector(".live-status").classList.toggle("active", !!active);
  $("team-home").textContent = match?.home || "SV Aufheim II";
  $("team-away").textContent = match?.away || "Gegner";
  $("score").textContent = match ? `${match.homeScore} : ${match.awayScore}` : "– : –";
  $("match-date").textContent = match ? new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "Europe/Berlin" }).format(new Date(match.createdAt)) : "AUFHEIM E2";
  $("match-updated").textContent = match ? `Zuletzt gemeldet: ${dateText(match.updatedAt || match.createdAt)}` : "Warte auf Spielstart";

  // Put the Aufheim crest on whichever side actually represents Aufheim.
  const crest = document.querySelector(".live-logo");
  const ball = document.querySelector(".live-opponent-crest");
  const oursHome = !match || match.home.includes("Aufheim");
  const homeSlot = $("team-home").parentElement;
  const awaySlot = $("team-away").parentElement;
  if (oursHome) {
    homeSlot.insertBefore(crest, homeSlot.firstChild);
    awaySlot.insertBefore(ball, awaySlot.firstChild);
  } else {
    homeSlot.insertBefore(ball, homeSlot.firstChild);
    awaySlot.insertBefore(crest, awaySlot.firstChild);
  }

  const list = $("event-feed");
  list.replaceChildren();
  const events = Object.values(match?.events || {}).sort((a, b) => b.at - a.at);
  $("event-count").textContent = `${events.length} EVENTS`;
  if (!events.length) {
    const li = document.createElement("li");
    li.className = "event-empty";
    li.textContent = "Noch keine Ereignisse gemeldet.";
    list.append(li);
    return;
  }
  for (const event of events) {
    const item = document.createElement("li");
    if (event.type.startsWith("goal")) item.className = "event-goal";
    const when = document.createElement("span");
    when.className = "event-when";
    when.textContent = event.minute ? `${event.minute}′` : new Date(event.at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });
    const desc = document.createElement("span");
    desc.className = "event-detail";
    const strong = document.createElement("strong");
    strong.textContent = eventNames[event.type] || "Ereignis";
    desc.append(strong);
    if (event.note) {
      const small = document.createElement("small");
      small.textContent = event.note;
      desc.append(small);
    }
    item.append(when, desc);
    list.append(item);
  }
}

function errorFeedback(error) {
  const message = error?.code === "PERMISSION_DENIED" || error?.code === "permission-denied"
    ? "Keine Schreibberechtigung. Bitte deinen Google-Nutzer in Firebase als Reporter freischalten lassen."
    : `Konnte nicht speichern: ${error?.message || "Unbekannter Fehler"}`;
  $("reporter-feedback").textContent = message;
}

if (!FIREBASE_CONFIG || !FIREBASE_CONFIG.apiKey || !FIREBASE_CONFIG.databaseURL) {
  notice("Der Liveticker ist vorbereitet, aber noch nicht mit der kostenlosen Echtzeit-Datenbank verbunden. Bis dahin können keine Live-Meldungen gespeichert werden.", "error");
  $("sign-in").disabled = true;
  $("sign-in").textContent = "Einrichtung ausstehend";
} else {
  try {
    const app = initializeApp(FIREBASE_CONFIG);
    const db = getDatabase(app);
    const auth = getAuth(app);
    const liveRef = ref(db, "live/current");

    onValue(liveRef, (snapshot) => {
      render(snapshot.val());
      notice("Live-Verbindung aktiv. Neue Meldungen erscheinen automatisch auf allen geöffneten Geräten.", "ready");
    }, (error) => notice(`Live-Daten konnten nicht geladen werden: ${error.message}`, "error"));

    onAuthStateChanged(auth, (user) => {
      currentUser = user;
      $("reporter-tools").hidden = !user;
      $("sign-in").hidden = !!user;
      $("sign-out").hidden = !user;
      $("reporter-status").textContent = user ? `${user.displayName || "Reporter"} · UID: ${user.uid}` : "Nicht angemeldet";
    });
    getRedirectResult(auth).catch(errorFeedback);
    $("sign-in").addEventListener("click", async () => {
      try { await signInWithPopup(auth, new GoogleAuthProvider()); }
      catch (error) {
        if (["auth/popup-blocked", "auth/operation-not-supported-in-this-environment"].includes(error.code)) {
          await signInWithRedirect(auth, new GoogleAuthProvider());
        } else errorFeedback(error);
      }
    });
    $("sign-out").addEventListener("click", () => signOut(auth).catch(errorFeedback));

    const change = async (mutator) => {
      if (!currentUser) return;
      $("reporter-feedback").textContent = "Speichert …";
      try {
        const result = await runTransaction(liveRef, (old) => {
          if (!old) return;
          const copy = JSON.parse(JSON.stringify(old));
          const next = mutator(copy);
          if (!next) return;
          next.updatedAt = Date.now();
          return next;
        }, { applyLocally: false });
        $("reporter-feedback").textContent = result.committed ? "✓ Gespeichert – Zuschauer sehen die Meldung jetzt live." : "Kein aktives Spiel. Bitte zuerst ein Spiel anlegen.";
      } catch (error) { errorFeedback(error); }
    };

    $("new-match").addEventListener("click", async () => {
      const opponent = $("opponent-input").value.trim();
      if (opponent.length < 2) return errorFeedback({ message: "Bitte einen Gegner eingeben." });
      if (currentMatch && currentMatch.status !== "finished" && !window.confirm("Das aktuelle Spiel samt Ereignissen wirklich durch ein neues ersetzen?")) return;
      const ours = "SV Aufheim II";
      const home = $("venue-input").value === "home" ? ours : opponent;
      const away = $("venue-input").value === "home" ? opponent : ours;
      const now = Date.now();
      try {
        await runTransaction(liveRef, () => ({ home, away, homeScore: 0, awayScore: 0, status: "planned", createdAt: now, updatedAt: now }), { applyLocally: false });
        $("reporter-feedback").textContent = "✓ Neues Spiel angelegt.";
      } catch (error) { errorFeedback(error); }
    });

    function appendEvent(state, type, note = "") {
      state.events ||= {};
      const key = push(ref(db, "live/eventKeys")).key;
      const minute = Number.parseInt($("minute-input").value, 10);
      state.events[key] = { type, at: Date.now(), ...(minute >= 1 && minute <= 120 ? { minute } : {}), ...(note ? { note } : {}) };
      // Keep a bounded feed, even over long tournaments.
      const keys = Object.keys(state.events).sort((a, b) => state.events[a].at - state.events[b].at);
      for (const oldKey of keys.slice(0, Math.max(0, keys.length - 80))) delete state.events[oldKey];
      return state;
    }

    document.querySelectorAll("[data-event]").forEach((button) => button.addEventListener("click", () => {
      const type = button.dataset.event;
      change((match) => {
        const nextStatus = { start: "first", half: "half", resume: "second", end: "finished" }[type];
        if (nextStatus) {
          const before = match.status;
          match.status = nextStatus;
          appendEvent(match, type);
          const last = Object.values(match.events).at(-1);
          last.previousStatus = before;
        } else if (type.startsWith("goal")) {
          const oursHome = match.home.includes("Aufheim");
          const homeGoal = (type === "goal-us") === oursHome;
          match[homeGoal ? "homeScore" : "awayScore"] += 1;
          appendEvent(match, type);
        }
        return match;
      });
    }));

    $("send-note").addEventListener("click", () => {
      const note = $("note-input").value.trim();
      if (!note) return errorFeedback({ message: "Bitte eine Meldung eintragen." });
      change((match) => appendEvent(match, "note", note));
      $("note-input").value = "";
    });

    $("undo").addEventListener("click", () => {
      if (!window.confirm("Wirklich das letzte Ereignis zurücknehmen?")) return;
      change((match) => {
        const entries = Object.entries(match.events || {}).sort((a, b) => b[1].at - a[1].at);
        if (!entries.length) return;
        const [key, event] = entries[0];
        if (event.type.startsWith("goal")) {
          const homeGoal = (event.type === "goal-us") === match.home.includes("Aufheim");
          const field = homeGoal ? "homeScore" : "awayScore";
          match[field] = Math.max(0, match[field] - 1);
        } else if (event.previousStatus) match.status = event.previousStatus;
        delete match.events[key];
        return match;
      });
    });

    const nextMatch = window.AUFHEIM_DATA?.nextMatch;
    if (nextMatch) {
      const oursHome = nextMatch.home.includes("Aufheim");
      $("opponent-input").value = oursHome ? nextMatch.away : nextMatch.home;
      $("venue-input").value = oursHome ? "home" : "away";
    }
  } catch (error) { notice(`Fehler beim Start des Livetickers: ${error.message}`, "error"); }
}
