Gridiron Lab — Conference Studio repair

This patch uses plain scoped CSS, not Tailwind. It does NOT change existing global CSS, the navigation, school catalog, or logos.

1. Back up your existing project folder and retain its browser data.
2. Extract the ZIP and open the contained conference-style-fix/src/app/conferences folder.
3. Copy BOTH page.tsx and conference-studio.css into C:\Github Projects\cfp-studio\src\app\conferences\.
4. Restart npm run dev and open http://localhost:3001/conferences.

Notable repairs:
- Three-column broadcast design and large logos with plain CSS
- Existing conference settings stored under the same localStorage key
- School additions from the available team pool now work
- Uses stable school IDs to avoid duplicate assignments
- Turning divisions on/off preserves existing members
- Defaults group FBS schools by their real catalog conference rather than arbitrary slices
- Championships editable, export available

This is a UI and local conference-editor patch; schedules and simulations are not automatically changed by realignment.
