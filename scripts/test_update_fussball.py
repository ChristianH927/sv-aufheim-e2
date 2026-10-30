"""Offline guardrails for the automated public-table importer."""

import unittest
from update_fussball import merge, parse_matches, parse_standings


class ImporterTests(unittest.TestCase):
    def test_match_dates_and_names(self):
        html = '''<table><tbody>
        <tr class="row-headline"><td>Freitag, 30.10.2026 - 16:15 Uhr | Kreisstaffel</td></tr>
        <tr><td class="column-club"><div class="club-name">SV Pfaffenhofen II</div></td>
        <td class="column-club"><div class="club-name">SGM SV Aufheim II /&#8203; AH</div></td>
        <td class="column-score">private-score-glyphs</td></tr></tbody></table>'''
        self.assertEqual(parse_matches(html), [{"date": "2026-10-30", "time": "16:15", "home": "SV Pfaffenhofen II", "away": "SV Aufheim II"}])

    def test_standings_validation(self):
        def row(name, own=False):
            return f'''<tr class="{'own' if own else ''}">
            <td>x</td><td>1.</td><td><div class="club-name">{name}</div></td>
            <td>5</td><td>4</td><td>1</td><td>0</td><td>36 : 19</td><td>17</td><td>13</td></tr>'''
        markup = '<div id="team-fixture-league-tables"><table><tbody>' + row('SGM SV Aufheim II / AH', True) + ''.join(row(f'Club {i}') for i in range(4)) + '</tbody></table></div>'
        teams = parse_standings(markup)
        self.assertEqual(teams[0]["name"], "SV Aufheim II")
        self.assertEqual(teams[0]["goalsFor"], 36)
        self.assertEqual(len(teams), 5)

    def test_one_new_match_is_safe_to_infer(self):
        old_team = {"name": "SV Aufheim II", "ours": True, "played": 5, "wins": 4, "draws": 1, "losses": 0, "goalsFor": 36, "goalsAgainst": 19, "points": 13}
        old = {"updated": "2026-10-30", "updatedLabel": "30. Oktober 2026", "standings": [old_team], "results": [],
               "nextMatch": {"date": "2026-10-30", "time": "16:15", "home": "SV Pfaffenhofen II", "away": "SV Aufheim II", "note": "Auswärtsspiel"}}
        fresh = {**old_team, "played": 6, "wins": 5, "goalsFor": 40, "goalsAgainst": 21, "points": 16}
        latest = {"date": "2026-10-30", "time": "16:15", "home": "SV Pfaffenhofen II", "away": "SV Aufheim II"}
        result = merge(old, [fresh], [latest], [], "2026-10-31")
        self.assertEqual(result["results"][0]["score"], "2 : 4")
        self.assertEqual(result["results"][0]["outcome"], "win")
        self.assertIsNone(result["nextMatch"])

    def test_no_guessing_when_two_games_are_missing(self):
        old_team = {"name": "SV Aufheim II", "ours": True, "played": 5, "wins": 4, "draws": 1, "losses": 0, "goalsFor": 36, "goalsAgainst": 19, "points": 13}
        old = {"standings": [old_team], "results": [], "nextMatch": None}
        fresh = {**old_team, "played": 7, "wins": 5, "draws": 2, "goalsFor": 42, "goalsAgainst": 24}
        games = [{"date": d, "home": "SV Aufheim II", "away": "Opponent", "time": "15:00"} for d in ("2026-11-06", "2026-11-13")]
        result = merge(old, [fresh], games, [], "2026-11-14")
        self.assertEqual(result["results"], [])


if __name__ == "__main__":
    unittest.main()
