# Personal site working agreement

Read `docs/DESIGN_CONSTRAINTS.md` before changing visual design, content presentation, preview behavior or print rendering. It records the user's current global constraints and is the design reference for this codebase; the user's latest direct instruction takes precedence.

- Use 1440 CSS px as the sole design canvas; other widths are responsive checks derived from it, not parallel design candidates. Both the desk and standalone master preview default to the 1440 canvas.
- Continue the single selected main version. Archived mockups and review pages are historical evidence, not alternative defaults.
- Keep the site and the design desk on shared components and renderers. Preserve preview parity at the same configuration and viewport.
- Keep shared ink roles, registration, screen angles/shapes and the three screen tiers coherent.
- Preserve Artifacts' independent styles and source previews.
- Public copy still requires user confirmation; do not infer copy approval from layout approval or publish the draft without instruction.
- Follow the parent project's read-only rule for `sources/`; do not modify synced references or CV material for this task.
- When the user changes a global constraint, update the constraint document with its implementation. Do not replace it with a pointer to a chronological handoff.

## Verify before pushing

- `npm run verify` runs the deploy workflow's steps: `astro check`, tests, build. The versioned `.githooks/pre-push` hook runs it (enabled by `npm install`/`npm ci` via `prepare`).
- Design-tool outputs (Blender marks, the four-ink landscape plates) are regenerated with `npm run design` (Python environment: `design/requirements.txt`); never edit them by hand. `tests/design-outputs.test.mjs` fails if a generator, source or output drifts.

## Print pipeline boundary

- Before adding or changing a printed element, read `docs/ADDING_A_PRINT_ELEMENT.md`.
- New printed elements must use `definePrintElement` (or `screenOriginal`, which calls it). Use `print-pipeline/index.ts` for pure stages and `print-pipeline/browser.ts` for publication. Original-color inserts explicitly use the `insert` profile.
- Keep visual recipes parameterized and versioned. Do not add element-local screening, noise/PRNG, ink compositing, or fallback-swap implementations. Source adapters may sample images/geometry; they do not own print effects.
- Preserve the `a7a7483` render baseline during architectural migration. Do not update golden fingerprints to make a regression pass. A visual change needs explicit user scope and a new reviewed baseline.
- The legacy/source-adapter boundary inventory is a migration debt list, not permission for new bypasses. Remove entries as paths retire; do not expand it merely to pass the guard.

## Shared stage ownership

- Active print effects must use `print-pipeline/transfer.ts` (`transferPlate`); screening and output adapters must not compute press noise, roller loss, or spreading. Preserve each approved recipe's parameters instead of adding a parallel element renderer.
- Use `sheet-context.ts` for shared paper coordinates/fields and `registration.ts` for placement. Insert originals explicitly use the neutral `insert` recipe; do not print already printed assets twice.
- Physical expansion is globally disabled. Legacy `inkEdge`/gain settings must not reactivate it.
- For architecture-only edits, retain the pre-edit output fixture and pass `tests/unified-stages.test.mjs`; do not regenerate that fixture from the edited implementation. Historical renderers must not be added back to release media or active clients.
