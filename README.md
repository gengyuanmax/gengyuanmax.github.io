# Gengyuan Zhang · personal website

https://gengyuanmax.github.io/

An Astro site with a shared two-ink print system and a local design desk. The main composition is designed at 1440px and adapts to smaller screens.

## Development

Use Node 22.19 or newer (CI uses 22.23.3).

```sh
npm ci
npm run dev -- --port 4321
```

The site is at `/`; the local editor is at `/design/`.

```sh
npm test
npm run check
npm run build
```

## Maintenance

- [Design constraints](docs/DESIGN_CONSTRAINTS.md)
- [Architecture and editing](FRAMEWORK.md)
- [Deployment and compatibility](docs/DEPLOYMENT.md)

The initial Astro release is published from verified `dist/` files to the existing `gh-pages` branch. This source is kept on `codex/personal-brand-rebuild`. Automatic deployment is pending: `docs/deployment/deploy-astro.yml` is the ready template; the current main-branch workflow still builds Jekyll. Editor routes and local configuration APIs never enter the published bundle. The old `bin/deploy` script is not used.
