(function () {
  "use strict";

  const data = window.AUFHEIM_DATA;
  if (!data) {
    document.getElementById("data-banner-text").textContent = "Die Teamdaten konnten nicht geladen werden. Bitte data.js prüfen.";
    return;
  }

  const $ = (id) => document.getElementById(id);
  const ours = data.standings.find((team) => team.ours);
  const rank = data.standings.indexOf(ours) + 1;
  const delta = ours.goalsFor - ours.goalsAgainst;
  const sourceLinks = ["top-source", "data-banner-source", "table-source", "next-source", "closing-source"];
  sourceLinks.forEach((id) => { $(id).href = data.source; });

  $("competition").textContent = data.competition.toUpperCase();
  $("season").textContent = `SAISON ${data.season}`;
  $("hero-rank").textContent = rank;
  $("stat-points").textContent = ours.points;
  $("stat-wins").textContent = ours.wins;
  $("stat-goals").textContent = ours.goalsFor;
  $("stat-difference").textContent = `${delta > 0 ? "+" : ""}${delta}`;
  $("league-team-count").textContent = `${data.standings.length} TEAMS`;
  $("footer-updated").textContent = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Berlin" }).format(new Date(`${data.updated}T12:00:00Z`));
  $("data-banner-text").textContent = `Verifizierter Tabellenstand vom ${data.updatedLabel}`;

  // Auf GitHub Pages bleibt diese Momentaufnahme unverändert, bis die Datei
  // data.js aktualisiert wird. Deshalb nach einigen Tagen deutlich markieren.
  const ageDays = (Date.now() - new Date(`${data.updated}T23:59:59+01:00`).getTime()) / 86400000;
  if (ageDays > 2) {
    $("data-banner-text").textContent = `Momentaufnahme vom ${data.updatedLabel} – aktuelle Ergebnisse bitte bei Fußball.de prüfen`;
    document.querySelector(".banner-dot").style.cssText = "background:#f9e4cf;border-color:#e4a36f";
  }

  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
  $("standings-body").innerHTML = data.standings.map((team, index) => {
    const goalDiff = team.goalsFor - team.goalsAgainst;
    return `<tr class="${team.ours ? "our-row" : ""}">
      <td><span class="rank-badge">${index + 1}</span></td>
      <td class="team-cell">${escapeHTML(team.name)}${team.ours ? '<span class="our-dot" aria-label="Unser Team"></span>' : ""}</td>
      <td>${team.played}</td><td class="desktop-col">${team.wins}</td><td class="desktop-col">${team.draws}</td><td class="desktop-col">${team.losses}</td>
      <td class="desktop-col">${team.goalsFor}:${team.goalsAgainst}</td>
      <td>${goalDiff > 0 ? "+" : ""}${goalDiff}</td><td class="points-col">${team.points}</td>
    </tr>`;
  }).join("");

  const longDate = (iso) => new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "numeric", month: "long", timeZone: "Europe/Berlin" }).format(new Date(`${iso}T12:00:00Z`)).toUpperCase();
  const shortDateParts = (iso) => {
    const d = new Date(`${iso}T12:00:00Z`);
    return [new Intl.DateTimeFormat("de-DE", { day: "2-digit", timeZone: "Europe/Berlin" }).format(d), new Intl.DateTimeFormat("de-DE", { month: "short", year: "numeric", timeZone: "Europe/Berlin" }).format(d).toUpperCase()];
  };
  if (data.nextMatch) {
    $("next-date").textContent = longDate(data.nextMatch.date);
    $("next-time").innerHTML = `${escapeHTML(data.nextMatch.time)} <span>UHR</span>`;
    $("next-home").textContent = data.nextMatch.home;
    $("next-away").textContent = data.nextMatch.away;
    $("next-note").textContent = ageDays > 2 ? "TERMIN LAUT DATENSTAND" : data.nextMatch.note.toUpperCase();
  } else {
    $("next-date").textContent = "NOCH NICHT ANGESETZT";
    $("next-time").innerHTML = `– <span>UHR</span>`;
    $("next-home").textContent = "Spielplan";
    $("next-away").textContent = "Folgt";
    $("next-note").textContent = "NEUE TERMINE AUF FUSSBALL.DE";
  }
  document.querySelector(".stat-card:nth-child(1) .stat-hint").textContent = `aus ${ours.played} Spielen`;
  document.querySelector(".stat-card:nth-child(4) .stat-hint").textContent = `${ours.goalsFor} erzielt · ${ours.goalsAgainst} kassiert`;
  $("hero-rank").textContent = rank;
  document.querySelector(".ranking-label").lastChild.textContent = rank === 1 ? " TABELLENFÜHRER" : " TABELLENPLATZ";

  const outcomeLabel = { win: "SIEG", draw: "REMIS", loss: "NIEDERLAGE" };
  const outcomeShort = { win: "S", draw: "U", loss: "N" };
  const renderResults = (filter) => {
    const results = data.results.filter((match) => filter === "all" || match.outcome === filter);
    $("result-list").innerHTML = results.length ? results.map((match) => {
      const [day, monthYear] = shortDateParts(match.date);
      return `<article class="result-card" aria-label="${escapeHTML(match.home)} gegen ${escapeHTML(match.away)}: ${match.score ? escapeHTML(match.score) : outcomeLabel[match.outcome]}">
        <div class="result-date"><strong>${day}</strong><span>${monthYear}</span></div>
        <div class="result-names"><strong>${escapeHTML(match.home)}</strong><small>${escapeHTML(match.away)}</small></div>
        <div class="result-score"><span class="${match.score ? "score-text" : "score-unknown"}">${match.score ? escapeHTML(match.score) : outcomeLabel[match.outcome]}</span><span class="outcome-tag ${match.outcome}">${outcomeLabel[match.outcome]}</span></div>
      </article>`;
    }).join("") : '<div class="empty-results">Für diesen Filter sind keine Spiele hinterlegt.</div>';
  };
  renderResults("all");

  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-filter]").forEach((other) => { other.classList.toggle("active", other === button); other.setAttribute("aria-pressed", other === button ? "true" : "false"); });
      renderResults(button.dataset.filter);
    });
  });

  const oldestFirst = data.results.slice(0, 5).reverse();
  $("form-circles").innerHTML = oldestFirst.map((match) => `<span class="form-circle ${match.outcome === "win" ? "" : match.outcome}" title="${outcomeLabel[match.outcome]}">${outcomeShort[match.outcome]}</span>`).join("");
  $("form-circles").setAttribute("aria-label", `Form (alt bis neu): ${oldestFirst.map((match) => outcomeLabel[match.outcome]).join(", ")}`);
  const wins = oldestFirst.filter((match) => match.outcome === "win").length;
  const draws = oldestFirst.filter((match) => match.outcome === "draw").length;
  $("form-copy").textContent = `${wins} Siege, ${draws} Unentschieden. ${oldestFirst.every((match) => match.outcome !== "loss") ? "Noch ungeschlagen." : "Gemeinsam weiter!"}`;
  $("form-rule-fill").style.width = `${Math.round((wins + draws * .5) / Math.max(1, oldestFirst.length) * 100)}%`;

  let toastTimer;
  const toast = (message) => {
    $("toast").textContent = message;
    $("toast").classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $("toast").classList.remove("show"), 2800);
  };
  $("share-button").addEventListener("click", async () => {
    const url = location.href.split("#")[0];
    if (navigator.share && location.protocol !== "file:") {
      try { await navigator.share({ title: "SV Aufheim E2 – Team-Dashboard", text: "Die Tabelle und Ergebnisse der Aufheim E2", url }); }
      catch (error) { if (error.name !== "AbortError") toast("Teilen war nicht möglich."); }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast("Link kopiert!");
    } catch (_) {
      toast("Nach der Veröffentlichung kannst du den Seitenlink teilen.");
    }
  });
})();
