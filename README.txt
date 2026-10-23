Gridiron Lab Bowl Delete Fix

Replace src/app/bowls/page.tsx in your project.
This patch builds on the Playoff & Bowl Integration version.
Delete is immediate, and Undo Delete restores the last removed bowl.
Existing localStorage keys, bracket links, per-card filters, and logos are preserved.
Restart the Next.js dev server afterward.
