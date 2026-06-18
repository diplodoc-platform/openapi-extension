# ADR-003: OpenAPI companions — the extension's role

This document is a short wrapper. The full end-to-end contract of the **OpenAPI companion**
(`*.openapi.json`) feature is described in the canonical CLI ADR:
`@diplodoc/cli` → `packages/cli/adr/ADR-007-openapi-companions.md`.

## What the openapi-extension specifically does

`src/includer`:

- `companion.ts`:
  - `buildCompanionDocument(document, spec)` — builds a standalone document from the partially
    dereferenced input (schemas stay as `$ref`), keeping only the operations actually rendered,
    stripping `x-hidden` and pruning unreachable `components.schemas`;
  - `serializeCompanionDocument(document)` — minified JSON.
- `index.ts` → `resolveCompanion()`:
  - decides the effective `renderMode` (`inline` | `hidden` | `link`), including the automatic
    `inline → link` switch driven by `maxOpenapiIncludeInlineSize` (default `100K`, cap `1M`,
    `0` = always link) with an INFO log;
  - decides whether the companion makes it into `files` (gating by `ai.openapiCompanions`,
    `outputFormat`, `maxOpenapiIncludeSize`) — this is the single place emission is gated;
  - degrades `link → inline` when the file cannot be created, to avoid dead links.
- `utils.ts` → `companionFilename(input)` — derives the companion name from the source spec
  (`petstore.yaml` -> `petstore.openapi.json`).
- `ui/main.ts` — for `renderMode: link`, adds a link to the companion file on the leading page.
- `constants.ts` / `models.ts` — `SPEC_RENDER_MODE_LINK`, the size limits,
  `DEFAULT_OPENAPI_COMPANIONS_MODE` (the single default for `ai.openapiCompanions`), and the
  `OpenApiBuildConfig` type (the slice of the build config the includer reads from `run.config`).

Defaults for build config values come from the CLI (passed via `run.config`); the extension only
applies its own fallbacks for standalone consumers that call the includer without a fully populated
build config.

Config (`ai.openapiCompanions`, `maxOpenapiIncludeInlineSize`), writing the file to disk, and the
build manifest are the CLI's responsibility — see the canonical ADR.

```

```
