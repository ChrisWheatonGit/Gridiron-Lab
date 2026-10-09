# Gridiron Lab — Schedule & Top 25 Add-on

This additive update introduces `/schedule` and `/top-25` without touching `src/data/teams.json`, `public/logos`, or the bracket engine.

Copy the included `src` folder over your existing project's `src` folder. **Merge directories; don't delete the originals.** This patch changes `src/app/layout.tsx` to insert navigation, adds `src/app/studio-tools.css`, and adds new page/component files.

In VS Code:

```powershell
cd 'C:\Github Projects\cfp-studio'
npm run dev
```

Then open `http://localhost:3001/schedule` and `http://localhost:3001/top-25`.

- Schedules are saved per team and season to browser localStorage. Scores are user-entered, not live.
- The Top 25 is an independent, user-editable poll, not a live AP ranking.
- Team names, colors, and logo URLs are loaded from your existing installed team catalog.
- To keep multiple devices synced or publish rankings to other users, a database is needed in a future release.
