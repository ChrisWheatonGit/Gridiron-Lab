# Gridiron Lab — Visual Bracket Update

This package is a **UI patch**, not a full data replacement.

## Before installing

1. Stop the local development server (Ctrl+C).
2. Make a backup of your existing cfp-studio project.
3. Extract the archive. Copy the included `src/app/page.tsx` and `src/app/globals.css` to the **same relative paths** in your existing project, replacing only those two files.
4. **Do not delete or replace `src/data/teams.json`, `public/logos`, `scripts`, `.env*`, or other data files.** The current synced schools and logos remain untouched.
5. In `C:\Github Projects\cfp-studio`, run `npm run dev` (the project's standard script uses port 3001).

## Visual updates

- SVG bracket connectors between each match and its next-round destination.
- Larger school logos and improved matchup card typography.
- More legible gold highlighted advancement paths.
- Enlarged national champion display.
- Drag-target highlighting when moving school tiles into seed slots.
- Keeps the same localStorage key, bracket state schema, team lookup, imports, exports, game results, division filtering, and logo paths.

## Notes

- This patch does not change team or logo counts. It relies on the synced catalog already in your local project.
- The playoff bracket deliberately scrolls horizontally to keep legible matchup cards, especially for 24- and 32-team formats.
- Development dependencies weren't available to execute a full Next.js build in the packaging environment; TypeScript/TSX syntax was parsed successfully.
