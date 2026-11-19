# SkillBridge visual direction

## Career journal

SkillBridge is a working bridge between learning and employment. Its interface should feel like a considered professional journal: warm paper for the reading surface, forest ink for dependable structure, and a small vermilion marker to call out decisions and next steps. The identity uses a hand-drawn bridge profile with two piers and a single marked crossing point. The crossing is the brand's own graphic shorthand for a capability becoming an opportunity.

## Design tokens

- Paper: `#F4F1E8`; raised surface: `#FBFAF6`; ink: `#202921`; muted ink: `#687168`.
- Forest: `#244435`; supporting moss: `#77876F`; accent vermilion: `#C65B3D`.
- Lines: `#DCD8CD`; success: `#2E6A4B`; warning: `#9A6A24`; error: `#A74437`.
- Display: Georgia / Iowan Old Style serif stack. Interface: Avenir Next / Segoe UI sans stack. Numerals and IDs use a compact monospace stack only when useful.
- Motion: short opacity and position transitions only; respect reduced-motion settings. No third-party animation runtime is added.

## Layout principles

- Desktop workspaces use a compact forest navigation rail and a wide paper content canvas.
- Each role gets its own navigation map and data hierarchy; repeated records use dividers and table rows rather than repeated tiles.
- Student pages emphasize progress and next actions. Company pages emphasize recruiting activity. Institution pages emphasize student outcomes. Admin pages emphasize review queues and platform access.
- At narrow widths, the rail becomes a drawer and a short bottom navigation strip; data tables become stacked records.

Reference study: Dribbble's student and education dashboard collections and the EduVista shot informed hierarchy, progress presentation and whitespace only. Kokonut UI was reviewed for component interaction craft. Motion, Anime.js and Three.js were reviewed; CSS transitions are sufficient for this application, so no animation or 3D dependency was added. The implementation is original and does not copy the example identity or layout.
