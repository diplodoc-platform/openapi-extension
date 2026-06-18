import type {OpenAPIV3} from 'openapi-types';
import type {
    Dereference,
    LeadingPageSpecRenderMode,
    OpenApiIncluderParams,
    Run,
    Specification,
    V3Endpoint,
    V3Info,
    YfmPreset,
    YfmTocItem,
} from './models';

import assert from 'assert';
import {dirname, join} from 'path';
import {readFileSync} from 'fs';
import SwaggerParser from '@apidevtools/swagger-parser';

import {companionFilename, filterUsefulContent, matchFilter, mdPath, sectionName} from './utils';
import * as parsers from './parsers';
import * as generators from './ui';
import {$ref, RefsService} from './services/refs';
import {buildCompanionDocument, serializeCompanionDocument} from './companion';
import {
    DEFAULT_MAX_OPENAPI_INCLUDE_INLINE_SIZE,
    DEFAULT_OPENAPI_COMPANIONS_MODE,
    LEADING_PAGE_MODES,
    LEADING_PAGE_NAME_DEFAULT,
    LeadingPageMode,
    MAX_OPENAPI_INCLUDE_INLINE_SIZE_LIMIT,
    SPEC_RENDER_MODES,
    SPEC_RENDER_MODE_DEFAULT,
    SPEC_RENDER_MODE_HIDDEN,
    SPEC_RENDER_MODE_LINK,
} from './constants';

class OpenApiIncluderError extends Error {
    path: string;

    constructor(message: string, path: string) {
        super(message);

        this.name = 'OpenApiIncluderError';
        this.path = path;
    }
}

/**
 * Shared context passed through all includer rendering layers (parsers, UI).
 */
export type Context = {
    /** YFM preset variables resolved for current TOC file. */
    vars: Readonly<YfmPreset>;
    /** Includer params taken from TOC. */
    params: Readonly<OpenApiIncluderParams>;
    /** Mapping from tag id (including special `__root__`) to custom tag config. */
    tag(id: string): {alias?: string; hidden?: boolean; path?: string; name?: string} | undefined;
    /** Service that manages `$ref` loading, normalization and `$defs` building. */
    refs: RefsService;
    /** Resolves relative paths against current run input root. */
    relative: (path: string) => string;
};

/**
 * Entry point for OpenAPI includer.
 * - Validates and partially dereferences OpenAPI document.
 * - Builds rendering context (refs, vars, tags).
 * - Produces TOC structure and Markdown files for endpoints and sections.
 */
export async function includer(run: Run, params: OpenApiIncluderParams, tocPath: string) {
    const {input, tags = {}} = params;

    const vars = run.vars.for(tocPath);
    const contentPath = join(run.input, input);

    const parser = new SwaggerParser();

    try {
        const data = (await parser.validate(contentPath, {
            validate: {spec: true},
            mutateInputSchema: false,
            dereference: {
                // @see /adr/ADR-001-swagger-ref-resolution.md
                excludedPathMatcher: (path: string) => {
                    return path.match('/components/schemas') || path.endsWith('/schema');
                },
                onDereference: (
                    path: string,
                    value: object,
                    parent?: Record<string, unknown>,
                    prop?: string,
                ) => {
                    if (parent && prop) {
                        parent[prop] = {
                            ...value,
                            [$ref]: path,
                        };
                    }
                },
            },
        })) as Dereference<OpenAPIV3.Document>;

        const mergedData = (await parser.validate(contentPath, {
            validate: {spec: true},
            mutateInputSchema: false,
        })) as OpenAPIV3.Document;

        const ctx: Context = {
            params,
            vars,
            relative: (path: string) => join(run.input, path),
            tag(id: string) {
                return tags[id];
            },
            refs: new RefsService(run, data, contentPath),
        };

        await ctx.refs.resolve(data);

        const spec = filterSpec(data, ctx);
        const info = parsers.info(data);
        const toc = generateToc(data, ctx);
        const companionName = companionFilename(input);
        const companion = resolveCompanion(data, spec, ctx, run, companionName);

        const files = [
            generateMainPage(mergedData, spec, info, ctx, companion.renderMode, companionName),
            ...generateContent(spec, ctx),
            companion.file,
        ].filter(Boolean) as {path: string; content: string}[];

        return {toc, files};
    } catch (error) {
        if (error && !(error instanceof OpenApiIncluderError)) {
            // eslint-disable-next-line no-ex-assign
            error = new OpenApiIncluderError(error.toString(), tocPath);
        }

        throw error;
    }
}

function assertSpecRenderMode(mode: string) {
    const isValid = SPEC_RENDER_MODES.has(mode);

    assert(
        isValid,
        `invalid spec display mode ${mode}, available options:${[...SPEC_RENDER_MODES].join(', ')}`,
    );
}

function assertLeadingPageMode(mode: string) {
    const isValid = LEADING_PAGE_MODES.has(mode);

    assert(
        isValid,
        `invalid leading page mode ${mode}, available options: ${[...LEADING_PAGE_MODES].join(
            ', ',
        )}`,
    );
}

/**
 * Builds YFM TOC structure from parsed OpenAPI document and includer context.
 */
function generateToc(data: Dereference<OpenAPIV3.Document>, ctx: Context): YfmTocItem {
    const {vars, params} = ctx;
    const {leadingPage, filter} = params;
    const leadingPageName = leadingPage?.name ?? LEADING_PAGE_NAME_DEFAULT;
    const leadingPageMode = leadingPage?.mode ?? LeadingPageMode.Leaf;

    assertLeadingPageMode(leadingPageMode);

    const filterContent = filterUsefulContent(filter, vars);
    const {tags, endpoints} = filterContent(parsers.paths(data, parsers.tags(data)));

    const toc: YfmTocItem & {items: YfmTocItem[]} = {
        items: [],
    };

    tags.forEach((tag, id) => {
        // eslint-disable-next-line no-shadow
        const {name, endpoints: endpointsOfTag} = tag;

        const section: YfmTocItem & {items: YfmTocItem[]} = {
            name,
            items: [],
        };

        const custom = ctx.tag(tag.name);
        const customId = custom?.alias || id;

        section.items = endpointsOfTag.map((endpoint) => handleEndpointRender(endpoint, customId));

        const customLeadingPageName = custom?.name || leadingPageName;

        if (!custom?.hidden) {
            addLeadingPage(
                section,
                leadingPageMode,
                customLeadingPageName,
                join(customId, 'index.md'),
            );
        }

        toc.items.push(section);
    });

    for (const endpoint of endpoints) {
        toc.items.push(handleEndpointRender(endpoint));
    }

    const root = ctx.tag('__root__');
    const rootLeadingPageName = root?.name || leadingPageName;

    if (!root?.hidden) {
        addLeadingPage(toc, leadingPageMode, rootLeadingPageName, 'index.md');
    }

    return toc;
}

function addLeadingPage(section: YfmTocItem, mode: LeadingPageMode, name: string, href: string) {
    if (mode === LeadingPageMode.Leaf) {
        (section.items as YfmTocItem[]).unshift({
            name: name,
            href: href,
        });
    } else {
        section.href = href;
    }
}

type EndpointRoute = {
    path: string;
    content: string;
};

function filterSpec(data: Dereference<OpenAPIV3.Document>, ctx: Context) {
    const {vars, params} = ctx;
    const {filter, noindex, hidden} = params;

    const filterContent = filterUsefulContent(filter, vars);
    const applyNoindex = matchFilter(noindex || {}, vars, (endpoint) => {
        endpoint.noindex = true;
    });

    const applyHidden = matchFilter(hidden || {}, vars, (endpoint) => {
        endpoint.hidden = true;
    });

    const spec = parsers.paths(data, parsers.tags(data));

    if (noindex) {
        applyNoindex(spec);
    }

    if (hidden) {
        applyHidden(spec);
    }

    return filterContent(spec);
}

function generateMainPage(
    data: OpenAPIV3.Document,
    spec: Specification,
    info: V3Info,
    ctx: Context,
    leadingPageSpecRenderMode: LeadingPageSpecRenderMode,
    companionName: string,
) {
    const {params} = ctx;
    const {input} = params;
    const customLeadingPageDir = dirname(ctx.relative(input));

    const root = ctx.tag('__root__');

    if (root?.hidden) {
        return;
    }

    const mainContent = root?.path
        ? readFileSync(join(customLeadingPageDir, root.path)).toString()
        : generators.main(
              {data, info, spec, leadingPageSpecRenderMode, companionFilename: companionName},
              ctx,
          );

    return {
        path: 'index.md',
        content: mainContent,
    };
}

type CompanionResult = {
    renderMode: LeadingPageSpecRenderMode;
    file?: {path: string; content: string};
};

/**
 * Decides how the spec is exposed on the root leading page and whether the standalone
 * `*.openapi.json` companion is emitted, taking into account:
 *  - the configured `leadingPage.spec.renderMode`;
 *  - `maxOpenapiIncludeInlineSize` (auto-switch `inline` -> `link` for large specs);
 *  - `ai.openapiCompanions` and `outputFormat` (whether the file is produced at all);
 *  - `maxOpenapiIncludeSize` (a too-large companion is not written).
 *
 * All of these knobs come from {@link Run.config} — i.e. they are passed in from the CLI
 * build config (the single source where defaults are resolved). The fallbacks applied here
 * ({@link DEFAULT_OPENAPI_COMPANIONS_MODE}, {@link resolveInlineLimit}) exist only for
 * standalone includer consumers that call it without a fully-populated build config.
 *
 * This is the only place where companion emission is gated: the CLI extension simply writes
 * whatever {@link CompanionResult.file} is returned, so there is no separate flag check there.
 */
function resolveCompanion(
    data: Dereference<OpenAPIV3.Document>,
    spec: Specification,
    ctx: Context,
    run: Run,
    companionName: string,
): CompanionResult {
    const {params} = ctx;
    const configured = params.leadingPage?.spec?.renderMode ?? SPEC_RENDER_MODE_DEFAULT;
    assertSpecRenderMode(configured);

    const root = ctx.tag('__root__');

    // `hidden` never auto-changes and never emits a companion file.
    if (configured === SPEC_RENDER_MODE_HIDDEN || root?.hidden) {
        return {renderMode: SPEC_RENDER_MODE_HIDDEN};
    }

    const document = buildCompanionDocument(data as unknown as OpenAPIV3.Document, spec);
    const content = serializeCompanionDocument(document);
    const bytes = Buffer.byteLength(content, 'utf-8');

    const config = run.config ?? {};
    const willEmit = shouldEmitCompanion(config, bytes);
    const inlineLimit = resolveInlineLimit(config.content?.maxOpenapiIncludeInlineSize);

    let renderMode: LeadingPageSpecRenderMode = configured;
    if (configured === SPEC_RENDER_MODE_DEFAULT && (inlineLimit === 0 || bytes > inlineLimit)) {
        renderMode = SPEC_RENDER_MODE_LINK;
    }

    // Avoid a dead link: if no companion file will be written, fall back to embedding inline.
    if (renderMode === SPEC_RENDER_MODE_LINK && !willEmit) {
        renderMode = SPEC_RENDER_MODE_DEFAULT;
    }

    if (configured === SPEC_RENDER_MODE_DEFAULT && renderMode === SPEC_RENDER_MODE_LINK) {
        run.logger?.info?.(
            `OpenAPI leading page spec render mode changed from 'inline' to 'link': ` +
                `specification size (${bytes} bytes) exceeds maxOpenapiIncludeInlineSize ` +
                `(${inlineLimit} bytes).`,
        );
    }

    return {
        renderMode,
        file: willEmit ? {path: companionName, content} : undefined,
    };
}

function shouldEmitCompanion(config: NonNullable<Run['config']>, bytes: number): boolean {
    const aiMode = config.ai?.openapiCompanions ?? DEFAULT_OPENAPI_COMPANIONS_MODE;
    if (aiMode === false) {
        return false;
    }

    // `'md'` -> only md2md; `true` -> both md2md and md2html.
    const emitByOutputFormat = aiMode === true || config.outputFormat !== 'html';
    if (!emitByOutputFormat) {
        return false;
    }

    const maxFileSize = config.content?.maxOpenapiIncludeSize ?? 0;

    return maxFileSize === 0 || bytes <= maxFileSize;
}

/** Resolves the effective inline-size limit: default when unset, clamped to the hard cap, 0 = always link. */
function resolveInlineLimit(value?: number): number {
    if (value === undefined) {
        return DEFAULT_MAX_OPENAPI_INCLUDE_INLINE_SIZE;
    }
    if (value <= 0) {
        return 0;
    }

    return Math.min(value, MAX_OPENAPI_INCLUDE_INLINE_SIZE_LIMIT);
}

/**
 * Produces a flat list of Markdown files for:
 * - main (root) page,
 * - tag section pages,
 * - individual endpoint pages (tagged and untagged).
 */
function generateContent(spec: Specification, ctx: Context): EndpointRoute[] {
    const {params} = ctx;
    const {input, sandbox} = params;
    const contentPath = ctx.relative(input);
    const customLeadingPageDir = dirname(contentPath);

    const results: EndpointRoute[] = [];

    spec.tags.forEach((tag, id) => {
        const {endpoints} = tag;

        const custom = ctx.tag(tag.name);
        const customId = custom?.alias || id;

        endpoints.forEach((endpoint) => {
            results.push(handleEndpointIncluder(endpoint, customId, sandbox, ctx));
        });

        if (custom?.hidden) {
            return;
        }

        const content = custom?.path
            ? readFileSync(join(customLeadingPageDir, custom.path)).toString()
            : generators.section(tag);

        results.push({
            path: join(customId, 'index.md'),
            content,
        });
    });

    for (const endpoint of spec.endpoints) {
        results.push(handleEndpointIncluder(endpoint, '.', sandbox, ctx));
    }

    return results;
}

function handleEndpointIncluder(
    endpoint: V3Endpoint,
    pathPrefix: string,
    sandbox: {host?: string} | undefined,
    ctx: Context,
) {
    const path = join(pathPrefix, mdPath(endpoint));
    const content = generators.endpoint(endpoint, sandbox, ctx);

    return {path, content};
}

function handleEndpointRender(endpoint: V3Endpoint, pathPrefix?: string): YfmTocItem {
    let path = mdPath(endpoint);
    if (pathPrefix) {
        path = join(pathPrefix, path);
    }

    return {
        href: path,
        name: sectionName(endpoint),
        hidden: endpoint.hidden,
        deprecated: endpoint.deprecated,
    };
}
