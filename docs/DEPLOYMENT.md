# Deployment

Initial online snapshot authorized by the user on 2026-10-14. This publishes the current copy as a working version, without changing the per-record editorial approval flags.

- Live URL: https://gengyuanmax.github.io/
- Current Astro source: `codex/personal-brand-rebuild`; published static files: `gh-pages`, root directory.
- This first release is built and checked locally, then committed normally to the existing `gh-pages` branch. Deployment history is preserved; no force-push is used.
- The current GitHub OAuth authorization cannot update workflow files. The ready Astro workflow is stored at `docs/deployment/deploy-astro.yml` and is not active.
- `main` still contains the legacy Jekyll source and workflow. Do not merge or push the Astro source to main until the workflow can be replaced: a main push currently rebuilds the legacy site. Enable the template with a workflow-capable authorization in a later maintenance step.
- Local `/design/`, draft configuration APIs and proof tools are development-only and excluded from the release.
- `scripts/prepare-release.mjs` retains byte-identical, already-public PDF downloads and `/print-lab/` redirects. `/publications/`, `/projects/`, `/repositories/` and `/cv/` point to the corresponding new sections.
- Existing blog/news/people/teaching archives, reports, feed and their legacy assets are retained in the published tree. They are historical material, not a second current homepage.
- The private CV master and local planning workspace are never copied to the release.
- Production metadata is indexable. Local development stays `noindex,nofollow`.

## Release checks

Run `npm test`, `npm run check`, and `npm run build`. Verify the actual production homepage, four navigation panels, portrait, responsive name screening, old redirects and PDF URLs after Pages finishes. Do not consider a source push or build alone proof that the site is live.

Until automatic deployment is enabled, publish the checked `dist/` tree in a separate checkout of the latest `gh-pages`, preserving the historical paths listed above, and make a normal commit and push. Do not use the legacy `bin/deploy` script.

## Previous version and recovery

The last Jekyll source was `4405af5`; its static Pages snapshot was `fe6e617`. Both remain in Git history. Recover a previous version by making a new reviewed commit/release; do not force-reset either branch.
