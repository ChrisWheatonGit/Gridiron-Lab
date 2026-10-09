GRIDIRON LAB — REMOVE CONFERENCE MEMBER PATCH

Replace ONLY:
  src/app/conferences/page.tsx
  src/app/conferences/conference-studio.css

Back up your current files first. Do NOT replace navigation, logos or teams.json.
Restart npm run dev. On /conferences, click the X on an assigned team card. The school returns to the Team Library for its division; change the library division filter or clear search if not visible.
Browser localStorage stays intact; same gridiron-conference-studio-v1 key.
