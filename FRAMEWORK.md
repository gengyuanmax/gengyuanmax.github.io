# Personal site framework

**Design reference:** [全局设计约束](docs/DESIGN_CONSTRAINTS.md). Read this before changing the main version; historical mockups and chronological handoffs do not override it.

The selected Home reading flow is confirmed. On 2026-10-14 the user authorized publishing the current snapshot as the first online version. Production uses public metadata; local previews retain `noindex,nofollow`. This release authorization does not mark every copy item as permanently finalized. Artifacts retain their independent layouts and original preview materials. See [deployment notes](docs/DEPLOYMENT.md).

## One main version

`/` and `/design/` use the same Home component, responsive CSS and print pipeline. Home order (2026-10-21): name → role, job-market status, introduction, contacts (incl. CV) → mountain-and-portrait print → “visual intelligence” with the three directions → News → Selected projects. Two reading modes share the markup: **Poster** (Riso poster composition, phones always) and **Compact** (label | content index, desktop default); see design constraints §26 and §26e. 1440 CSS px is the sole primary design canvas. There is no A/B selector.

- `/design/`: the only visual editing desk. Global, Area and Element scopes edit the current version; layout and print panels organize parameters. Inspection tools include grid, DOM reading order, screen tiers, ink proofs and responsive widths.
- `/design/?view=preview`: the same 1440 canvas without the editing sidebar, carrying the current session draft; fit and original-size modes only change its display scale.
- `/design/content/`: review draft public wording and evidence. The candidate slogan lives in `src/config/main-version.ts`; layout approval does not approve it.
- Previous `layout`, `navigation`, `home`, `portrait`, `composition`, `material` and `emphasis` routes redirect to `/design/`.
- Historical experiment sources and pre-consolidation snapshots are in `design-lab/archive/pre-main-2026-10-14/`, stored as `.txt` outside application compilation. Earlier mockups remain historical references only.

The standalone-current-preview link carries the same session draft; plain `/` shows saved settings. Both desk and standalone master preview default to 1440, with the display scale labeled. Other sizes are explicit responsive checks. Save writes `src/config/design.json`; unsaved changes survive reload in this tab under a version-specific session key. Restore returns to the saved snapshot; export downloads the current draft. Neither save nor build publishes the site. `mainDesignConfig` removes retired choices and objects from old configurations, and selected design directions resolve consistently across preview and build.

## Run and inspect

Use Node 22.19 or newer. npm scripts use the existing local Node package.

```sh
ASTRO_TELEMETRY_DISABLED=1 npm run dev -- --port 4321
npm test
npm run test:server
ASTRO_TELEMETRY_DISABLED=1 npm run check
ASTRO_TELEMETRY_DISABLED=1 npm run build
```

Run the server smoke check with the development server active. It tests redirects, resource delivery and configuration save/rejection, then restores the original configuration. Avoid running it alongside a build, because the round-trip temporarily changes an override.

## Where changes belong

| File | Responsibility |
| --- | --- |
| `src/data/content.ts` | All public copy: `profile` (name, role, `status`, `introduction`, `affiliations`, `collaboration`, `contacts`), `pillars` (`detail`, `summary` per direction), `selectedProjects` + `selectedLines`, `projects`, `news`, `sectionCopy`. Public copy still requires the user's approval; the latest answers are in `docs/COPY_QA.md` |
| `src/data/publications.ts` | Publication list (Research › Publications; own name bold, `*` equal contribution) |
| `public/files/Gengyuan_Zhang_CV.pdf` | CV linked from every contact row (`contacts` entry `CV`); replace the file to update it |
| `src/components/areas/Home.astro` | Home markup: intro, landscape figure, directions with split circle stamps, News, Selected projects |
| `src/styles/home-layout.css` | **Home layout for both modes** (loaded last): poster placements, compact label/content grid, phones |
| `src/styles/reading-modes.css` | Poster / Compact for the other pages (Research, Artifacts, About) and the mode toggle |
| `src/styles/rhythm.css` + `scripts/rhythm.mjs` | Müller-Brockmann rows: every vertical size rounded to `--baseline` at build (PostCSS); opt out with a `rhythm:off` comment |
| `src/config/home-landscape.ts` + `scripts/render-home-landscape.mjs` | Mountain-and-portrait print (sources `src/assets/home/mountain.jpg`, `public/images/portrait-source-cutout.png`; crop, size, person placement) rendered by `npm run media` |
| `src/config/about-photo.ts` + `scripts/render-about-photo.mjs` | About photograph print |
| `src/design/emphasis.ts`, `src/design/emphasis-print.ts`, `src/styles/body-emphasis.css` | Body emphasis band (colour/coverage with contrast guard; printed band masks; per-phrase misregistration from `print-pipeline/registration.ts`). Mark phrases in `src/config/body-emphasis.ts` or with `EmphasisText` |
| `src/config/main-version.ts` | Selected directions, draft slogan, retired objects and draft version key |
| `src/design/settings.ts` | Typed parameters, inheritance, validation and main-version normalization |
| `src/config/design.json` | Saved global values and page/element overrides |
| `src/design/screen.ts` | Three shared screen tiers and per-ink angle/shape tokens |
| `src/design/print-pipeline/index.ts` | Shared print declaration and versioned N-ink core |
| `src/design/reading-route.ts`, `src/client/reading-flow.ts`, `src/client/print-routes.ts` | Research/Artifacts metro-line reading guides (geometry → shared pipeline) |
| `src/data/catalog.ts` | Chronology, primary research membership and resource priorities (link labels: Project, arXiv, GitHub, Dataset, Model …) |
| `src/client/studio.ts`, `src/client/preview.ts` | Development-only editor and live preview connection |
| `scripts/design-server.ts` | Local routes and validated save endpoint |

### Common edits

- **Change Home copy, status or links**: edit `src/data/content.ts`; record the approved wording in `docs/COPY_QA.md`.
- **Choose or reorder Selected projects**: `selectedProjects` (ids from `projects`) and `selectedLines` in `content.ts`; links come from each project's `links`.
- **Update the CV**: replace `public/files/Gengyuan_Zhang_CV.pdf` (keep the name).
- **Add News**: append to `news` in `content.ts` (newest first; dates as `DD Mon YYYY` or `Mon YYYY`).
- **Move something on Home**: `src/styles/home-layout.css`; keep whole columns on the 12-column grid and vertical sizes in rows; separate sections by scale, print and space, not full-width rules.
- **Change the landscape**: edit `src/config/home-landscape.ts`, run `npm run media`, check 1440 poster/compact and 390.
- **Emphasize a phrase**: add the exact substring to `src/config/body-emphasis.ts` (or wrap with `EmphasisText`); no emphasis in headings, metadata or links.
- **Verify**: `npm test`, `npm run check`, `npm run build`; look at 1440 (both modes) and 390.

Global → area → element overrides preserve literal zero and reset to inheritance. Per-ink palette, screen angles/shapes and registration are shared across the page. Retired composition directions cannot override the selected version. Unsupported parameter scopes fail validation.

## Print system

The Home landscape (mountain + portrait) and the About photograph are build-time prints on the medium 4px / coarse tiers. The display name keeps coarse dots at every size (1/16em, never below 4px). Research circles retain the explicitly approved polygon recipe and 7px screen; see design constraints section 14. Screen tiers are fine 2px, medium 4px and type-relative 1/16em rounded to integer CSS pixels. At the current desktop name size the coarse pitch is 8px. Text follows the sharp-type-v3 size tiers: display type at 72px or above may use glyph-clipped uniform dots; 24–72px headings use solid two-ink text; smaller text remains clean single ink. Each ink has a global angle and dot shape. Texture density can vary without adding arbitrary frequencies. Integer CSS pixels reduce one source of inconsistency but do not guarantee absence of sampling moiré at every browser zoom or device scale.

Body text and metadata use clean blue ink; larger headings use shared two-ink overprint. Decorative text layers are hidden from accessibility and do not duplicate content. The screen audit is a development diagnostic, not an additional production palette. Ink proofs simulate digital plate composition, not press-ready separations.

`npm run media` renders the selected portrait composition and associated proof material; builds include it. Original assets and provenance are preserved. Artifacts are not forced through the portrait treatment.

## Pipeline migration (2026-10-14)

New elements follow [Adding a print element](docs/ADDING_A_PRINT_ELEMENT.md). Active title, tint, print-field, portrait and research paths use the shared entry; original-color inserts explicitly bypass ink conversion. The core owns versioned raster and polygon screening recipes, noise, transfer and publication. Compatibility exports retain old imports without duplicating algorithms. Selected image recipes are preserved; the subsequently approved sharp text and sheet-coordinate corrections are documented in design constraints sections 16–17. Fixed pre-migration fingerprints and architecture/mount tests protect this transition. Legacy print/portrait-flow paths remain inventoried; this is staged consolidation, not a claim that every historical renderer has been deleted.

## Historical release verification and remaining work

The consolidation passed 42 tests, the Astro check and static build checks. The build contains the selected Home order before JavaScript, three branches with real project links, 73 unique IDs, four areas and five Artifacts, without editor routes or code. Browser review covered 1440, 768, 375 and 320 CSS px with no horizontal document overflow, plus screen auditing, ink proof selection and current-version controls. Redirect and save round-trip checks passed.

Next: continue local refinements of this main version and finalize wording. The current snapshot is authorized for initial publication; future releases still follow the user’s instructions. This first release is published directly to `gh-pages` after local verification. The Astro workflow template is ready but inactive because the current GitHub authorization cannot update workflows; source stays on `codex/personal-brand-rebuild` until that migration is enabled.

Current pipeline verification: 71 tests pass, including four native separation modes, sheet roller continuity, static/live shared adapters and 44 unchanged legacy fingerprints. Portrait, research and motif fallback images share the active rendering core at documented reference dimensions. SVG ink fallback filters are removed. Responsive source sampling and placement can differ from build-time reference pixels.

### Active pipeline consolidation (2026-10-16)

All active print families use real `transferPlate` recipes in `print-pipeline/transfer.ts`, after their screen master is prepared. Sheet context, transfer, registration, and output adapters have separate ownership. Raster, text, polygon, line, rule, name-dot and insert recipes preserve their approved parameters; insert transfer is explicitly neutral. No dummy identity wrapper stands in for noise migration. Release media no longer calls legacy portrait-flow/print renderers. `unified-stages.test.mjs` guards the stage boundary and verifies the captured pre-consolidation outputs without changing the existing appearance. Physical expansion remains globally disabled. See the final section of `docs/ADDING_A_PRINT_ELEMENT.md` for the current source map; earlier test counts above are historical.
