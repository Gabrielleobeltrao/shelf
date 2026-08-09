# design-sync notes — Shelf

Shelf is an **app**, not a component library. There is no library build (no `dist`,
no `exports`), so the converter runs in **synth-entry mode** (discovers components
from `src/components`). This has consequences a re-sync must honor.

## Repo-specific setup (required for the converter to run)

- **Self-package symlink.** `cfg.pkg = "shelf"` must resolve under node_modules.
  The app doesn't self-install, so create the symlink before every build on a
  fresh clone (it's gitignored):
  `ln -sfn .. frontend/node_modules/shelf`
- **`srcDir = src/components`** (not `src`). Scoping to `src` pulls in `main.tsx`,
  which does `import './index.css'`, and esbuild then chokes on Tailwind v4's
  `@import "tailwindcss"`. Components live in `src/components`; pages/`main.tsx`
  are intentionally excluded.
- **CSS is compiled, not the Tailwind source.** `src/index.css` is a Tailwind v4
  *source* file (`@import "tailwindcss"`, `@theme`, `@utility`) — unusable as
  `cssEntry`. `cfg.cssEntry = ".ds-compiled.css"` (frontend-relative), a
  **generated** file. Regenerate it on every re-sync:
  1. `cd frontend && npm run build`
  2. take the largest `dist/assets/*.css` (the compiled app CSS)
  3. strip its `@font-face` blocks (fonts ship via `extraFonts` instead)
  4. write the result to `frontend/.ds-compiled.css`
  (One-liner used last time:
  `node -e "const fs=require('fs');let c=fs.readFileSync(process.argv[1],'utf8');c=c.replace(/@font-face\s*\{[^}]*\}/g,'');fs.writeFileSync('.ds-compiled.css',c)" dist/assets/index-*.css`)
- **Fonts** ship via `cfg.extraFonts` pointing at the `@fontsource/outfit` and
  `@fontsource/figtree` weight CSS files (16 @font-face → `fonts/`).
- Build command used:
  `node .ds-sync/package-build.mjs --config .design-sync/config.json --node-modules frontend/node_modules --out ./ds-bundle`
  (no `--entry` → synth mode). Playwright installed in `.ds-sync/` for the render check.

## What shipped (first sync, 2026-08-08)

- 57 components (28 real + 29 icons/illustrations), all as **floor cards**
  (no authored previews — the user chose "upload the working version now";
  rich previews are a future incremental pass).
- Render check: 55/57 clean. They render on-brand because `useI18n` reads a
  context with a **default value** (no provider needed for text).
- Project: `76c3764a-ef80-414a-9ef2-aa97d8faa3a9` ("Shelf Design System").

## Known render warns (legitimate — don't re-chase on re-sync)

- `[RENDER_THIN]` on every `*Icon`, the illustrations, `ShelfLogo`, and
  `NotificationsBell` — they're small/monochrome; the floor card renders them
  correctly, just with little painted area. Expected.
- `[RENDER_BLANK]` `EmptyState` — floor card is near-empty because the component
  needs `illustration/title/description` props. Author a preview to fix.
- `[RENDER_ERRORS]` `SharedPantryCard` — does a live `fetch` on mount; fails
  offline in the capture. Expected; skip or author without the fetch.

## Re-sync risks (what can silently go stale)

- **Weak prop contracts.** Synth mode couldn't extract prop types — every
  `<Name>Props` is `{ [key]: unknown }`. The design agent gets names + look but
  not real APIs. Fixing this needs a real TypeScript **declaration build** in the
  repo (emit `.d.ts` for the components and point the converter at them), or
  hand-written `cfg.dtsPropsFor` per component. Documented to the user; deferred.
- **`.ds-compiled.css` is generated and gitignored** — if a re-sync forgets to
  rebuild+strip+copy it, the CSS is stale (or missing). See the 4 steps above.
- **Tree-shaken CSS.** `_ds_bundle.css` contains only the utility classes the app
  actually uses. Designs the agent builds can only use those classes; for anything
  else it must use the CSS variables (`var(--color-primary-600)`, `var(--ink)`, …).
  The conventions header says this.
- **Self-symlink** `frontend/node_modules/shelf` is gitignored — recreate on a
  fresh clone before building.
- Fonts: only `latin` + `latin-ext` subsets shipped (matches the app).
