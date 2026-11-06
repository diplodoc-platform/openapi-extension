**english** | [русский](https://github.com/diplodoc-platform/openapi-extension/blob/master/README.ru.md)

---

[![NPM version](https://img.shields.io/npm/v/@diplodoc/openapi-extension.svg?style=flat)](https://www.npmjs.org/package/@diplodoc/openapi-extension)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=diplodoc-platform_openapi-extension&metric=alert_status)](https://sonarcloud.io/summary/overall?id=diplodoc-platform_openapi-extension)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=diplodoc-platform_openapi-extension&metric=coverage)](https://sonarcloud.io/summary/overall?id=diplodoc-platform_openapi-extension)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=diplodoc-platform_openapi-extension&metric=sqale_rating)](https://sonarcloud.io/summary/overall?id=diplodoc-platform_openapi-extension)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=diplodoc-platform_openapi-extension&metric=reliability_rating)](https://sonarcloud.io/summary/overall?id=diplodoc-platform_openapi-extension)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=diplodoc-platform_openapi-extension&metric=security_rating)](https://sonarcloud.io/summary/overall?id=diplodoc-platform_openapi-extension)

# @diplodoc/openapi-extension

OpenAPI extension for the Diplodoc platform. Provides:

- A MarkdownIt transform plugin for `openapi-sandbox` fenced blocks.
- An includer that turns OpenAPI specs into a set of Markdown pages.
- A browser runtime (React UI) to render the interactive OpenAPI sandbox.

## Features

- **YFM syntax support**
- **Schema rendering**: `oneOf` / `allOf`, enums, cyclic references
- **Sandbox UI**: interactive request/response UI rendered in browser
- **Includer pipeline**: generates Markdown files from OpenAPI definitions

## Installation

```bash
npm install @diplodoc/openapi-extension
```

## Usage

### Transform plugin (`openapi-sandbox` blocks)

Add the plugin to the transformer:

```js
import transform from '@diplodoc/transform';
import {transform as openapiSandbox} from '@diplodoc/openapi-extension';

const markdown = `
\`\`\`openapi-sandbox
method: post
path: /test
server: http://localhost:8080
\`\`\`
`;

const {result} = await transform(markdown, {
  plugins: [openapiSandbox()],
});
```

The plugin converts `openapi-sandbox` fences into DOM nodes that the runtime can hydrate in browser.

### Includer (OpenAPI → Markdown)

The includer entry point is exported as `@diplodoc/openapi-extension/includer`. It is used by the docs build pipeline to:

- Validate OpenAPI specs
- Resolve and normalize references
- Generate Markdown pages for endpoints and schema sections

The `sandbox` option accepts `host` and `customHost`. YFM preset variables in `host` are
resolved while the pages are generated. Set `customHost: true` to show a host input in each
sandbox; its last submitted value is stored per project, specification revision and operation.
Submitting an empty value restores the configured `host`.

```yaml
sandbox:
  host: "{{apiHost}}"
  customHost: true
```

#### Preset variables in conditions

The `noindex`, `filter`, and `hidden` options accept Liquid expressions in their
`endpoint` and `tag` fields. Endpoint or tag properties are available directly;
preset variables are available under `vars`. Do not wrap these expressions in `{{ }}`.

```yaml
# presets.yaml
default:
  noIndexOperations: [deletePet]
```

```yaml
# toc.yaml
items:
  - name: API
    include:
      path: api
      mode: link
      includers:
        - name: openapi
          input: petstore.yaml
          noindex:
            endpoint: vars.noIndexOperations contains operationId
```

This generates the `deletePet` endpoint page with `noIndex: true` in its frontmatter;
other endpoint pages remain indexable. The page is still generated and included in the TOC.
A tag condition can use `tag: vars.noIndexTags contains name` instead.
Matching tags also receive `noIndex: true` on their generated landing pages.
An endpoint-only condition does not change indexing of its tag's landing page.

Variables are resolved for the TOC containing the include, using its directory and
ancestor `presets.yaml` files, rather than the specification or generated output directory.
`--vars-preset` selects a preset that overrides `default` within each file; closer
preset files take precedence over ancestor files. `--vars` overrides preset values.
Arrays, booleans, numbers, and nested objects are supported as well as strings.
An empty `noIndexOperations` array matches no endpoints.

Programmatic callers of `includer(run, params, tocPath)` must initialize their variable
service before invoking the includer. The CLI does this before processing TOCs.

For details about the processing stages, see:

- `adr/ADR-002-openapi-processing-pipeline.md`

### Runtime (browser UI)

The runtime is exported as `@diplodoc/openapi-extension/runtime`. It renders the interactive UI into `.yfm-openapi-sandbox-js` placeholders produced by the transform plugin.

Import runtime entry and styles in your bundle:

```js
import '@diplodoc/openapi-extension/runtime';
import '@diplodoc/openapi-extension/runtime/styles';
```

## Development

```bash
npm install
npm run typecheck
npm test
npm run lint
npm run build
```

## Documentation

- ADRs: `adr/`
- Agent notes: `AGENTS.md`

## License

See `LICENSE`.
