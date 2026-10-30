#!/usr/bin/env python3
"""Conservative, low-frequency standings refresh for the Aufheim E2 site.

The source displays score digits with an obfuscated font. This importer never
decodes those glyphs. It infers a new result only if the team's aggregate
statistics prove exactly one new match since the previous snapshot.
"""

import argparse
from datetime import datetime, timezone
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "data.js"
TEAM_ID = "031BOECLT4000000VS5489BRVTPI24NQ"
PREVIOUS_URL = f"https://www.fussball.de/ajax.team.prev.games/-/mode/PAGE/team-id/{TEAM_ID}"
UPCOMING_URL = f"https://www.fussball.de/ajax.team.matchplan/-/mode/PAGE/team-id/{TEAM_ID}"


class Node:
    def __init__(self, tag="root", attrs=()):
        self.tag, self.attrs, self.children = tag, dict(attrs), []

    def findall(self, tag=None, cls=None, ident=None):
        for child in self.children:
            if not isinstance(child, Node):
                continue
            if (tag is None or child.tag == tag) and (cls is None or cls in child.attrs.get("class", "").split()) and (ident is None or child.attrs.get("id") == ident):
                yield child
            yield from child.findall(tag, cls, ident)

    def text(self):
        return "".join(c.text() if isinstance(c, Node) else c for c in self.children)


class Tree(HTMLParser):
    VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "wbr"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node()
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in self.VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in self.VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == tag:
                self.stack = self.stack[:index]
                break

    def handle_data(self, data):
        self.stack[-1].children.append(data)


def tree(html):
    parser = Tree()
    parser.feed(html)
    return parser.root


def tidy(text):
    return " ".join(text.replace("\u200b", "").replace("\xa0", " ").split())


def team_name(text):
    raw = tidy(text)
    return {"SGM SV Aufheim II / AH": "SV Aufheim II", "SGM FV Senden II": "FV Senden II"}.get(raw, raw)


def parse_standings(html):
    root = tree(html)
    container = next(root.findall(ident="team-fixture-league-tables"), None)
    if container is None:
        raise ValueError("Source league table not found")
    body = next(container.findall("tbody"), None)
    if body is None:
        raise ValueError("Source league table is empty")
    rows = []
    for tr in body.findall("tr"):
        cells = list(tr.findall("td"))
        if len(cells) < 10:
            continue
        club = next(cells[2].findall(cls="club-name"), None)
        goals = re.fullmatch(r"(\d+)\s*:\s*(\d+)", tidy(cells[7].text()))
        if club is None or goals is None:
            raise ValueError("Invalid club or goal cell")
        row = {"name": team_name(club.text()), "played": int(tidy(cells[3].text())),
               "wins": int(tidy(cells[4].text())), "draws": int(tidy(cells[5].text())),
               "losses": int(tidy(cells[6].text())), "goalsFor": int(goals[1]),
               "goalsAgainst": int(goals[2]), "points": int(tidy(cells[9].text()))}
        if "own" in tr.attrs.get("class", "").split():
            row["ours"] = True
        rows.append(row)
    if not 5 <= len(rows) <= 25 or sum(bool(r.get("ours")) for r in rows) != 1:
        raise ValueError(f"Invalid table: {len(rows)} teams, no unique Aufheim row")
    if len({r["name"] for r in rows}) != len(rows):
        raise ValueError("Duplicate names")
    if any(r["wins"] + r["draws"] + r["losses"] != r["played"] for r in rows):
        raise ValueError("Invalid played/win/draw/loss totals")
    return rows


def parse_matches(html):
    doc = tree(html)
    found = []
    match_date, match_time = None, None
    for tr in doc.findall("tr"):
        if "row-headline" in tr.attrs.get("class", "").split():
            match = re.search(r"(\d\d)\.(\d\d)\.(\d{4})\s*-\s*(\d\d:\d\d)", tidy(tr.text()))
            if match:
                dd, mm, yyyy, match_time = match.groups()
                match_date = f"{yyyy}-{mm}-{dd}"
            continue
        clubs = [next(td.findall(cls="club-name"), None) for td in tr.findall("td", cls="column-club")]
        if len(clubs) != 2 or any(c is None for c in clubs) or not match_date:
            continue
        if next(tr.findall(cls="column-score"), None) is None:
            continue
        found.append({"date": match_date, "time": match_time,
                      "home": team_name(clubs[0].text()), "away": team_name(clubs[1].text())})
    return found


def download(url):
    request = Request(url, headers={"User-Agent": "SV-Aufheim-E2-website/1.0", "Accept": "text/html"})
    with urlopen(request, timeout=40) as response:
        contents = response.read(2_000_000).decode("utf-8", "replace")
    if len(contents) < 1000:
        raise ValueError("Suspiciously short response")
    return contents


def load_snapshot():
    # Node evaluates only the local, trusted data file (not downloaded script).
    js = "const fs=require('fs'),vm=require('vm');let x={window:{}};vm.runInNewContext(fs.readFileSync(process.argv[1],'utf8'),x,{timeout:1000});process.stdout.write(JSON.stringify(x.window.AUFHEIM_DATA));"
    proc = subprocess.run(["node", "-e", js, str(DATA_FILE)], capture_output=True, text=True, check=True)
    return json.loads(proc.stdout)


def merge(old, standings, previous, upcoming, today):
    fresh = {**old, "standings": standings}
    saved = {(m["date"], m["home"], m["away"]): m for m in old["results"]}
    former = next(t for t in old["standings"] if t.get("ours"))
    current = next(t for t in standings if t.get("ours"))
    difference = {k: current[k] - former[k] for k in ("played", "wins", "draws", "losses", "goalsFor", "goalsAgainst")}
    unknown = [m for m in previous if (m["date"], m["home"], m["away"]) not in saved and "SV Aufheim II" in (m["home"], m["away"])]
    # Only one new played match and exactly one outcome => unambiguous score.
    if (difference["played"] == len(unknown) == 1 and
            sorted([difference["wins"], difference["draws"], difference["losses"]]) == [0, 0, 1] and
            difference["goalsFor"] >= 0 and difference["goalsAgainst"] >= 0 and
            ((difference["wins"] and difference["goalsFor"] > difference["goalsAgainst"]) or
             (difference["draws"] and difference["goalsFor"] == difference["goalsAgainst"]) or
             (difference["losses"] and difference["goalsFor"] < difference["goalsAgainst"]))):
        match = unknown[0]
        home = match["home"] == "SV Aufheim II"
        goals_for, goals_against = difference["goalsFor"], difference["goalsAgainst"]
        saved[(match["date"], match["home"], match["away"])] = {
            "date": match["date"], "home": match["home"], "away": match["away"],
            "score": f"{goals_for if home else goals_against} : {goals_against if home else goals_for}",
            "outcome": "win" if difference["wins"] else "draw" if difference["draws"] else "loss",
        }
    fresh["results"] = sorted(saved.values(), key=lambda m: m["date"], reverse=True)[:8]
    future = sorted((m for m in upcoming if m["date"] >= today), key=lambda m: (m["date"], m["time"]))
    if future:
        match = future[0]
        fresh["nextMatch"] = {**match, "note": "Heimspiel" if match["home"] == "SV Aufheim II" else "Auswärtsspiel"}
    elif old.get("nextMatch") and old["nextMatch"]["date"] < today:
        fresh["nextMatch"] = None
    if any(fresh[k] != old[k] for k in ("standings", "results", "nextMatch")):
        now = datetime.fromisoformat(today)
        month = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"][now.month - 1]
        fresh["updated"], fresh["updatedLabel"] = today, f"{now.day}. {month} {now.year}"
    return fresh


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--team-html", type=Path)
    parser.add_argument("--previous-html", type=Path)
    parser.add_argument("--upcoming-html", type=Path)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    old = load_snapshot()
    html = lambda local, url: local.read_text(encoding="utf8") if local else download(url)
    standings = parse_standings(html(args.team_html, old["source"]))
    previous = parse_matches(html(args.previous_html, PREVIOUS_URL))
    upcoming = parse_matches(html(args.upcoming_html, UPCOMING_URL))
    if not previous:
        raise ValueError("Recent games missing: old data retained")
    today = datetime.now(timezone.utc).date().isoformat()
    merged = merge(old, standings, previous, upcoming, today)
    output = ("/* Automatisch validierte FUSSBALL.DE-Momentaufnahme.\n"
              " * Bei Abruffehlern bleiben die zuletzt verifizierten Daten bestehen.\n"
              " */\nwindow.AUFHEIM_DATA = " + json.dumps(merged, ensure_ascii=False, indent=2) + ";\n")
    if args.dry_run:
        print(f"{len(standings)} teams, {len(previous)} recent matches, {len(upcoming)} upcoming; change={output != DATA_FILE.read_text(encoding='utf8')}")
        print(f"Next match: {merged['nextMatch']}; recent result: {merged['results'][0]}")
    elif output != DATA_FILE.read_text(encoding="utf8"):
        DATA_FILE.write_text(output, encoding="utf8")
        print("Updated data.js")
    else:
        print("No changes")


if __name__ == "__main__":
    main()
