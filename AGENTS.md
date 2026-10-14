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

## Print pipeline boundary

- Before adding or changing a printed element, read `docs/ADDING_A_PRINT_ELEMENT.md`.
- New printed elements must use `definePrintElement` (or `screenOriginal`, which calls it). Use `print-pipeline/index.ts` for pure stages and `print-pipeline/browser.ts` for publication. Original-color inserts explicitly use the `insert` profile.
- Keep visual recipes parameterized and versioned. Do not add element-local screening, noise/PRNG, ink compositing, or fallback-swap implementations. Source adapters may sample images/geometry; they do not own print effects.
- Preserve the `a7a7483` render baseline during architectural migration. Do not update golden fingerprints to make a regression pass. A visual change needs explicit user scope and a new reviewed baseline.
- The legacy/source-adapter boundary inventory is a migration debt list, not permission for new bypasses. Remove entries as paths retire; do not expand it merely to pass the guard.
