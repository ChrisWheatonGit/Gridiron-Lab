GRIDIRON LAB — MANUAL TOP 25 + BOWL GAMES

Install
1. Back up your Gridiron Lab project and stop npm run dev.
2. Open PowerShell in this extracted folder.
3. Run: powershell -ExecutionPolicy Bypass -File .\APPLY.ps1
4. Restart: cd 'C:\Github Projects\cfp-studio'; npm run dev
5. Visit http://localhost:3001/bowls and the Playoff Builder.

The installer modifies the existing Playoff Builder in place, adds /bowls,
adds its navigation link, and adds bowls to Saved Seasons archives if that page exists.
It does NOT overwrite StudioNav styles or change any logo.

Playoffs show manual Top 25 positions next to teams. Use the optional "Use Top 25 for Seeding"
button to replace bracket seeds from the saved poll. It prompts before clearing results.

Bowl games are fully manual. Bowl names are presets; bowl logos must be uploaded from
images you own or are entitled to use. Sponsor branding changes between years.

Before using, test npm run build. Changes made after the last uploaded project ZIP
cannot be validated in this environment. If the installer reports an unexpected
source format, do not force it: upload the current files for a precise patch.
