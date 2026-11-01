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
        <div class="result-score"><span class="${match.score ? "score-text" : "score-unknown"}">${match.score ? escapeHTML(match.score) + (match.inferred ? '<sup class="score-inferred-flag" title="Aus der Torbilanz berechnet">*</sup>' : "") : outcomeLabel[match.outcome]}</span><span class="outcome-tag ${match.outcome}">${outcomeLabel[match.outcome]}</span></div>
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


  // Die Porträts und Spieler sind bewusst frei erfundene DEMO-Daten.
  // Nach Freigabe können Namen, Nummern und echte Fotos ersetzt werden.
  const demoPlayers = Array.isArray(data.players) ? data.players : [];
  const squadTrack = $("squad-track");
  const squadPrev = $("squad-prev");
  const squadNext = $("squad-next");
  const squadCounter = $("squad-counter");
  const avatarPalettes = [
    {skin:"#e7ac83",hair:"#353039",bg:"#ead7b0"},
    {skin:"#bb7c59",hair:"#191919",bg:"#e8c7b5"},
    {skin:"#f3c59e",hair:"#8b5330",bg:"#d5d4c5"},
    {skin:"#d59c73",hair:"#27252b",bg:"#e5ceb0"},
    {skin:"#b97d5a",hair:"#4a2921",bg:"#e3cab5"},
    {skin:"#f0bd94",hair:"#aa6f3a",bg:"#e5d8be"}
  ];
  const hairShapes = [
    '<path d="M84 123 Q78 65 125 63 Q171 57 175 120 Q165 93 143 86 Q119 110 90 107 Z"/>',
    '<path d="M85 122 Q78 67 129 62 Q178 60 174 119 Q167 89 146 89 Q123 96 97 85 Z"/>',
    '<path d="M85 124 Q81 79 110 64 Q160 46 176 111 Q164 86 148 93 Q116 107 91 102 Z"/>',
    '<path d="M86 125 Q82 74 120 64 Q167 61 175 112 L166 96 Q144 102 130 91 Q112 106 92 105 Z"/>'
  ];
  const demoPortrait = (player, index) => {
    const p = avatarPalettes[index % avatarPalettes.length];
    return '<svg class="squad-avatar" viewBox="0 0 260 280" role="img" aria-label="Gezeichnetes Platzhalter-Porträt, kein echtes Foto">' +
      '<circle cx="130" cy="120" r="101" fill="' + p.bg + '" opacity=".62"/>' +
      '<circle cx="201" cy="65" r="28" fill="#fff" opacity=".12"/>' +
      '<path d="M20 280 Q30 210 92 194 L112 188 L148 188 L172 194 Q230 210 240 280Z" fill="#151518"/>' +
      '<path d="M72 205 L93 195 L118 217 L106 280 L81 280Z" fill="#b5263c"/>' +
      '<path d="M188 205 L167 195 L142 217 L154 280 L179 280Z" fill="#e8b751"/>' +
      '<path d="M110 185 L110 159 L150 159 L150 185 Q130 202 110 185Z" fill="' + p.skin + '"/>' +
      '<ellipse cx="89" cy="132" rx="9" ry="15" fill="' + p.skin + '"/>' +
      '<ellipse cx="171" cy="132" rx="9" ry="15" fill="' + p.skin + '"/>' +
      '<ellipse cx="130" cy="127" rx="45" ry="63" fill="' + p.skin + '"/>' +
      '<g fill="' + p.hair + '">' + hairShapes[index % hairShapes.length] + '</g>' +
      '<path d="M105 132 Q113 127 121 132 M139 132 Q147 127 155 132" fill="none" stroke="' + p.hair + '" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="114" cy="140" r="2.7" fill="#292426"/><circle cx="146" cy="140" r="2.7" fill="#292426"/>' +
      '<path d="M130 144 L126 158 Q130 161 134 158" fill="none" stroke="#a97158" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M117 167 Q130 177 144 166" fill="none" stroke="#9d604c" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M110 185 Q130 202 150 185 L143 202 Q130 211 117 202Z" fill="#f5f3ed"/>' +
      '<text x="130" y="264" font-family="Arial,sans-serif" font-weight="900" font-size="36" text-anchor="middle" fill="#fff">' + Number(player.number) + '</text>' +
      '<text x="199" y="218" font-family="Arial,sans-serif" font-weight="900" font-size="10" text-anchor="middle" fill="#eee5cd">SGM</text>' +
      '</svg>';
  };
  if (squadTrack && demoPlayers.length) {
    squadTrack.innerHTML = demoPlayers.map((player,index) =>
      player.type === "staff"
      ? '<article class="squad-card squad-cep-card" aria-label="' + escapeHTML(player.name) + ', ' + escapeHTML(player.title) + '">' +
          '<div class="squad-portrait squad-cep-portrait">' +
            '<img class="squad-cep-photo" src="' + escapeHTML(player.image) + '" width="250" height="248" alt="Foto von Chris" loading="lazy" />' +
          '</div>' +
          '<div class="squad-card-info squad-cep-info">' +
            '<strong>' + escapeHTML(player.name) + '</strong>' +
            '<span class="squad-cep-title">' + escapeHTML(player.title) + '</span>' +
          '</div>' +
        '</article>'
      : '<article class="squad-card" aria-label="' + escapeHTML(player.name) + ', Nummer ' + Number(player.number) + ', ' + escapeHTML(player.position) + ', Demo">' +
        '<div class="squad-portrait">' +
          '<span class="squad-jersey-num">#' + String(player.number).padStart(2,"0") + '</span>' +
          '<span class="squad-watermark" aria-hidden="true">E2</span>' +
          demoPortrait(player,index) +
        '</div>' +
        '<div class="squad-card-info"><span class="squad-position">' + escapeHTML(player.position) + '</span><strong>' + escapeHTML(player.name) + '</strong><span class="squad-teamline">SGM AUFHEIM / HOLZSCHWANG</span></div>' +
      '</article>'
    ).join("");
    const cardStep = () => {
      const card = squadTrack.querySelector(".squad-card");
      const gap = Number.parseFloat(getComputedStyle(squadTrack).columnGap) || 0;
      return (card ? card.getBoundingClientRect().width : 245) + gap;
    };
    const activeSquadIndex = () => Math.max(0,Math.min(demoPlayers.length-1,Math.round(squadTrack.scrollLeft/cardStep())));
    const updateSquadControls = () => {
      const selected = activeSquadIndex();
      squadCounter.textContent = String(selected+1).padStart(2,"0") + " / " + String(demoPlayers.length).padStart(2,"0");
      squadPrev.disabled = selected === 0;
      squadNext.disabled = selected === demoPlayers.length-1;
    };
    squadPrev.addEventListener("click", () => squadTrack.scrollTo({left:(activeSquadIndex()-1)*cardStep(),behavior:"smooth"}));
    squadNext.addEventListener("click", () => squadTrack.scrollTo({left:(activeSquadIndex()+1)*cardStep(),behavior:"smooth"}));
    squadTrack.addEventListener("scroll",updateSquadControls,{passive:true});
    window.addEventListener("resize",updateSquadControls,{passive:true});
    updateSquadControls();
  }

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
