# Shelf — how to build with this design system

Shelf is a bilingual (PT/EN) kitchen-management app: pantry, shopping list, recipes. Warm, tactile, mobile-first. The look is a warm off-white parchment ground with one vivid green accent, amber for "expiring soon", clay for "expired / destructive", Outfit for headings and Figtree for body.

## Setup & wrapping

- **No theme provider needed.** Light/dark is driven by a `data-theme` attribute on `<html>` — light is the default; set `data-theme="dark"` to switch. `dark:` utilities are keyed to that attribute, **not** the OS.
- **Most components render on their own.** Text-bearing components read translations from an i18n context that has a built-in default, so they show copy without any provider. To control the language, wrap in the app's `LanguageProvider`.
- **Navigation-aware components need a Router.** Anything with links or nav (headers, sidebars, the notifications bell, page shells) calls React Router hooks — wrap your app in a `BrowserRouter` or they throw.
- **Overlays self-portal.** Modals, bottom sheets, menus and dialogs render through a portal to `document.body` and pin to the viewport — drop them anywhere, no wrapper.

## Styling idiom — Tailwind v4 utilities + semantic tokens

Style with utility classes. The design language lives in **semantic tokens** (defined as CSS variables in `_ds_bundle.css`), so prefer these over raw colors:

| Role | Class | CSS var |
|---|---|---|
| Page ground | `bg-bg` | `var(--bg)` |
| Card / surface | `bg-surface`, `bg-surface-2` | `var(--surface)`, `var(--surface-2)` |
| Primary text | `text-ink` | `var(--ink)` |
| Secondary text | `text-muted` | `var(--muted)` |
| Hairline / border | `border-line` | `var(--line)` |

These flip automatically with `data-theme`. Accent scales are **fixed across themes** — use `dark:` variants to adjust on dark grounds:

- **primary** = vivid green, for the actions that matter: `bg-primary-600`, `text-primary-700`, `dark:text-primary-400`, `dark:bg-primary-900/40`.
- **mustard** = amber, semantic "expiring soon": `bg-mustard-100`, `text-mustard-700`.
- **rust** = clay, semantic "expired / destructive": `bg-rust-600`, `text-rust-700`.

Type: `font-display` = Outfit (headings, numbers, emphasis), `font-sans` = Figtree (body). Radius is soft: `rounded-xl` / `rounded-2xl` for cards & sheets, `rounded-full` for pills, steppers and icon buttons.

**Important — the stylesheet is the app's compiled (tree-shaken) set**, not all of Tailwind. Only the utility classes Shelf's components already use are present. If you need a class that isn't there, either reuse an existing one or style with the CSS variables directly (e.g. `style={{ background: "var(--surface-2)", color: "var(--ink)" }}`) — every semantic token and the used accent steps are defined in `:root`.

## Where the truth lives

- `styles.css` → imports `fonts/` and `_ds_bundle.css` (all classes + the `:root` tokens). Read `_ds_bundle.css` before styling.
- Each component: `<Name>.d.ts` (API) and `<Name>.prompt.md` (usage). **Note:** this DS was synced from an app without a TypeScript types build, so `<Name>Props` are generic (`[key]: unknown`) — lean on the preview cards and component names for intended use rather than the prop types.

## One idiomatic snippet

```jsx
// A pantry card in the Shelf idiom
<div className="space-y-2 rounded-2xl bg-surface-2 p-4">
  <div className="flex items-center justify-between">
    <p className="font-display font-bold text-ink">Arroz branco</p>
    <span className="rounded-full bg-mustard-100 px-2 py-0.5 text-xs font-medium text-mustard-700">
      Vence em 3 dias
    </span>
  </div>
  <p className="text-sm text-muted">Tio João · 2 un</p>
  <button className="rounded-full bg-primary-600 px-4 py-2 text-sm font-medium text-white">
    Repor
  </button>
</div>
```
