# AI agents in `extensions/openapi`

This package is edited not only by humans, but also by AI agents. This document explains **how agents should work with this package**.

> If you are a human and disagree with any rule here, feel free to open a PR to adjust it.

## General principles

- **Prefer small, review‑friendly changes**  
  Split large refactorings into several PRs. Keep diffs readable.

- **Respect the processing pipeline**  
  OpenAPI processing is split into independent stages (loading, normalization, OpenAPI rendering, JSON Schema rendering, UI composition). See `adr/ADR-002-openapi-processing-pipeline.md` for details before changing core processing logic.

- **Preserve existing style and patterns**  
  Follow the existing TypeScript style in this package: small focused functions, explicit types, early returns, descriptive variable names (no single-letter identifiers except trivial indices), and pure functions where possible.

- **Keep comments in English**  
  Even if commit messages or discussions are in another language, all code comments and JSDoc must be in English.

- **Avoid speculative changes**  
  Do not "improve" unrelated pieces of code that were not requested (renames, style tweaks, moving files) unless strictly necessary for the task.

## Project structure (high level)

The `src/` directory is split into three main areas with different responsibilities:

- **`includer/`**  
  Exported module used by the CLI. On the `toc.yaml` processing stage it takes OpenAPI specifications and generates a set of Markdown files from them.  
  The data processing pipeline described in `adr/ADR-002-openapi-processing-pipeline.md` is especially important here.

- **`plugin/`**  
  Works at the stage of transforming Markdown into HTML. It converts fenced code blocks like:

  ````markdown
  ```openapi-sandbox
  ...
  ```
  ````

  into interactive elements that allow testing the API in the rendered documentation.

- **`runtime/`**  
  Contains the actual OpenAPI testing UI that is rendered in the browser with React.  
  This layer should focus on presentation and interactions, relying on already normalized and prepared data.

## TypeScript & React specifics

- **Follow existing structure**
  - Keep one main responsibility per file.
  - Prefer pure functions and early returns.
  - Use descriptive variable names; avoid single‑letter names except for trivial loop indices.

- **Types**
  - Prefer explicit `import type { ... }` for types.
  - Avoid `any`, prefer `unknown` + narrowing.
  - Extract named interfaces/types for non‑trivial shapes.

- **React components (TSX)**
  - Keep components small and focused.
  - Derive render output from props/state; avoid hidden mutable module‑level state.
  - Prefer functional components and hooks already used in the codebase.

## Tests

- **Keep tests close to implementation**  
  Test files should mirror the structure and naming of the source: `foo.ts` → `foo.test.ts`.

- **Arrange‑Act‑Assert**  
  Structure tests as: data preparation (Arrange), action (Act), expectations (Assert).  
  Extract repeated setup into helper functions when used in multiple tests.

- **Snapshots**  
  When updating snapshots, make sure the change is intentional and corresponds to a documented behavior change.

## Tooling & constraints

- **Do not touch configuration without need**  
  Avoid changing `tsconfig*.json`, `package.json`, build scripts, and Jest/Vitest configs unless the task directly requires it.

- **Lint & type errors**  
  Never introduce new linter or TypeScript errors. If a fix requires touching many files, prefer a dedicated PR.

- **No network or external API assumptions**  
  Do not add logic that relies on external network calls from this package.

## Documentation

- **Update docs when behavior changes**  
  If you change observable behavior in `openapi` UI or schema rendering, update `README.md` and/or relevant docs in `adr/` when appropriate.

- **Explain non‑obvious decisions**  
  When adding complex logic, include a short English comment focusing on _why_ the decision is made, not _what_ the code does.

## Safety checklist for agents

Before finishing a change in `extensions/openapi`:

- [ ] The change is limited in scope and relevant to the request.
- [ ] No new TypeScript or lint errors were introduced.
- [ ] Existing coding style and patterns are preserved.
- [ ] Tests are updated or added when behavior changes.
- [ ] Public behavior changes are reflected in docs when needed.
