# Personal site framework

**Design reference:** [全局设计约束](docs/DESIGN_CONSTRAINTS.md). Read this before changing the main version; historical mockups and chronological handoffs do not override it.

The selected Home reading flow is confirmed. On 2026-10-14 the user authorized publishing the current snapshot as the first online version. Production uses public metadata; local previews retain `noindex,nofollow`. This release authorization does not mark every copy item as permanently finalized. Artifacts retain their independent layouts and original preview materials. See [deployment notes](docs/DEPLOYMENT.md).

## One main version

`/` and `/design/` use the same Home component, responsive CSS and branch renderer. The order is name → introduction/contact → research brand and three aspects → News. Desktop uses the previously selected B composition; narrow screens preserve the same reading order. 1440 CSS px is the sole primary design canvas. Intermediate widths keep the left-brand/right-branches relationship; small containers stack for readability. There is no A/B selector.

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
| `src/config/main-version.ts` | Selected directions, draft slogan, retired objects and draft version key |
| `src/components/areas/Home.astro` | Shared static Home reading structure and existing project links |
| `src/styles/home-main.css` | Selected Home layout and responsive rules |
| `src/client/home-branches.ts` | Decorative, responsive brand-to-aspect connectors |
| `src/design/settings.ts` | Typed parameters, inheritance, validation and main-version normalization |
| `src/config/design.json` | Saved global values and page/element overrides |
| `src/design/screen.ts` | Three shared screen tiers and per-ink angle/shape tokens |
| `src/design/press-material.ts` | Shared print material pipeline |
| `src/config/portrait-composition.ts` | Selected portrait/circle composition from Print Lab |
| `src/data/content.ts` | Content records; terminology and public copy still require approval |
| `src/data/catalog.ts` | Chronology, primary research membership and resource priorities |
| `src/client/studio.ts`, `src/client/preview.ts` | Development-only editor and live preview connection |
| `scripts/design-server.ts` | Local routes and validated save endpoint |

Global → area → element overrides preserve literal zero and reset to inheritance. Per-ink palette, screen angles/shapes and registration are shared across the page. Retired composition directions cannot override the selected version. Unsupported parameter scopes fail validation.

## Print system

Current portrait and circle share the medium 4 CSS px screen. Screen tiers are fine 2px, medium 4px and type-relative 1/16em rounded to integer CSS pixels. At the current desktop name size the coarse pitch is 8px. Narrow display names retain the same red base and blue screen, reusing the fine 2px tier when the em tier approaches the image frequency; only type at 16px or below becomes solid. `typeScreenLevel()` owns this choice independently of viewport width. Each ink has a global angle and dot shape. Texture density can vary without adding arbitrary frequencies. Integer CSS pixels reduce one source of inconsistency but do not guarantee absence of sampling moiré at every browser zoom or device scale.

Body text and metadata use clean blue ink; larger headings use shared two-ink overprint. Decorative text layers are hidden from accessibility and do not duplicate content. The screen audit is a development diagnostic, not an additional production palette. Ink proofs simulate digital plate composition, not press-ready separations.

`npm run media` renders the selected portrait composition and associated proof material; builds include it. Original assets and provenance are preserved. Artifacts are not forced through the portrait treatment.

## Verification and remaining work

The consolidation passed 42 tests, the Astro check and static build checks. The build contains the selected Home order before JavaScript, three branches with real project links, 73 unique IDs, four areas and five Artifacts, without editor routes or code. Browser review covered 1440, 768, 375 and 320 CSS px with no horizontal document overflow, plus screen auditing, ink proof selection and current-version controls. Redirect and save round-trip checks passed.

Next: continue local refinements of this main version and finalize wording. The current snapshot is authorized for initial publication; future releases still follow the user’s instructions. This first release is published directly to `gh-pages` after local verification. The Astro workflow template is ready but inactive because the current GitHub authorization cannot update workflows; source stays on `codex/personal-brand-rebuild` until that migration is enabled.
