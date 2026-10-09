# Gridiron Lab — College Football Bracket Studio

Fan-made interactive college football playoff builder inspired by dark, gold, broadcast-style bracket graphics. This is a **working Next.js app**, not a static mockup.

## Quick start (Windows PowerShell)

```powershell
cd cfp-studio
npm install
npm run dev
```

Visit **http://localhost:3000**.

## Features

- 4, 8, 12, 16, 24 or 32 teams; automatic correct first-round byes for non-power-of-two fields.
- Bracket winner advancement; later rounds remain logically valid if earlier winners change.
- Drag teams from the searchable library onto a seed, or swap seed tiles; click a library team to fill the first empty seed.
- FBS, FCS, DII, DIII and mixed-division fields; conference filters; 230 curated starters.
- Real ESPN-hosted team logos for the curated FBS schools (availability depends on ESPN); fallback school-color monograms; custom teams with custom image URLs.
- Manual optional score entry; winners are chosen by clicking teams (scores do not determine winners).
- Bracket names, seed assignment, decisions and custom teams automatically saved in the browser (`localStorage`).
- Save/import JSON; export readable results text; copy a share link with all bracket data encoded in its URL fragment.
- Desktop-first bracket board with horizontal scroll on narrow screens.

## Important data and licensing notes

The included `src/data/teams.json` is a **curated starter catalog**, not a complete or authoritative current-season directory of every NCAA football school. FBS covers 133 commonly known programs, but conference assignments are illustrative and can change. FCS/DII/DIII have sample catalogs; use Manage to add missing schools. FBS logos are referenced from ESPN's public image CDN; the app does not redistribute logo image binaries and some links may fail. Custom team logos can be specified with URLs. Institution marks and logos are owned by their respective rights holders. Before public/commercial deployment, confirm that your logo use and source terms are authorized, and verify program membership/conferences against authoritative directories.

This application does **not** claim an affiliation with CFP, ESPN, NCAA, schools, or conferences. No live rankings, schedules, simulations, auth database, hosted backend, PNG image export, or complete NCAA data feed are included. Those need separate implementation/data and possibly permissions.

## Project structure

- `src/app/page.tsx` — full interactive bracket UI and local browser persistence.
- `src/app/globals.css` — responsive sports broadcast styling.
- `src/lib/bracket.ts` — reusable seed order / bye / advancement bracket engine.
- `src/data/teams.json` — curated team catalog and ESPN logo references.

## Deploy

Works on Vercel or any host that supports a standard Next.js 15 application. Run `npm run build` before deployment.

## Notes

The URL share feature embeds saved data in the fragment, so it can become long with many custom teams. It requires Clipboard API support for copying (works normally on localhost or HTTPS). For shorter link slugs and cross-device account persistence, add Supabase/Postgres in a subsequent iteration.

## Updating all four NCAA division team catalogs

The ZIP ships with a **partial** offline starter directory (133 FBS, 35 FCS, 30 DII, 32 DIII). To **attempt a full 2026 import** using ESPN's division group data, run:

```powershell
npm run sync:teams
```

The updater uses ESPN division groups 80 (FBS), 81 (FCS), 57 (DII), and 58 (DIII), attempts a second ESPN endpoint when a group is short, and saves working logos locally under `public/logos` so they aren't dependent on browser hotlinking. It prints verified counts and **will refuse to overwrite the current team directory if the upstream source does not meet broad coverage thresholds**. That outcome is possible, particularly for DII and DIII: ESPN's public endpoints are unofficial and may omit schools or not provide a logo. Do not treat the threshold as an official NCAA team count. You can run `npm run sync:teams -- --skip-logos` to keep external URLs instead of caching assets, though that is less reliable. Logo rights remain with their respective owners; verify permissions before a public/commercial deployment.

The team browser's **available** number excludes teams already seeded, while its **total** shows all installed schools for that filter.

## Important: division sync safety (October 2026)

**Do not run `npm run sync:teams` to populate the public catalog.** The external ESPN
`groups` parameter has been observed returning overlapping schools across FBS, FCS,
DII and DIII. The importer now fails closed when it sees a school under more than
one division and also refuses unverified catalog overwrites. Team membership
requires a separately verified 2026 NCAA football roster.

If a previous import corrupted your catalog, stop the server and restore
`src/data/teams.json` from the newest `teams-before-sync-*.json` backup saved
in the project root. Otherwise copy `src/data/teams.json` from the original
project ZIP. The original starter catalog is partial but maintains separate
divisions. Restart the dev server after restoring.

## Corrected 2026 division synchronization (October 2026)

**Do not use the old ESPN `site.api` team-group synchronizer.** It returned all teams for each group.
This release replaces that script with a season-specific, preclassified SportsDataverse CSV:
`https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_cfb_teams/cfb_teams_2026.csv`.
SportsDataverse describes how its ESPN and CFBD classifications are derived in the release notes.

```powershell
npm run sync:teams
# optional: try downloading and caching available logo files
npm run sync:teams -- --cache-logos
npm run dev
```

Important: classification sources are incomplete/inconsistent for certain DII/DIII programs. An ambiguous or conflicting school is **excluded and reported**, not copied into all divisions. The importer creates `division-sync-report.json` and refuses to replace `teams.json` if any division has implausibly low coverage. Those minimums are safeguards, not official NCAA totals. Missing logos remain missing (display fallback badge); ESPN does not provide a verified logo for every football program. The catalog should be audited against the NCAA's current football sponsorship lists before claiming complete FBS/FCS/DII/DIII coverage. Importing does not require `--accept-unverified-membership`.

Each successful update saves `teams-before-sync-<timestamp>.json`. If an import fails before completion, the catalog remains unchanged. The dev port defaults to `3001` to avoid conflict with FinanceHub on `3000`.
