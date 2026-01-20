[![NPM version](https://img.shields.io/npm/v/@diplodoc/openapi-extension.svg?style=flat)](https://www.npmjs.org/package/@diplodoc/openapi-extension)

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
