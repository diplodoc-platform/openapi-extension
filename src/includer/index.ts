import type {
    OpenAPISpec,
    OpenApiIncluderParams,
    OpenJSONSchema,
    Run,
    V3Endpoint,
    V3Info,
    YfmPreset,
    YfmToc,
    YfmTocItem,
} from './models';

import assert from 'assert';
import {dirname, join} from 'path';
import {readFileSync} from 'fs';
import SwaggerParser from '@apidevtools/swagger-parser';

import {filterUsefullContent, matchFilter} from './utils';
import parsers from './parsers';
import generators from './ui';
import {RefsService} from './services/refs';
import {
    LEADING_PAGE_MODES,
    LEADING_PAGE_NAME_DEFAULT,
    LeadingPageMode,
    SPEC_RENDER_MODES,
    SPEC_RENDER_MODE_DEFAULT,
} from './constants';

const INCLUDER_NAME = 'openapi';

class OpenApiIncluderError extends Error {
    path: string;

    constructor(message: string, path: string) {
        super(message);

        this.name = 'OpenApiIncluderError';
        this.path = path;
    }
}

export type Context = {
    vars: Readonly<YfmPreset>;
    params: Readonly<OpenApiIncluderParams>;
    tag(id: string): {alias?: string; hidden?: boolean; path?: string; name?: string} | undefined;
    refs: RefsService;
    relative: (path: string) => string;
};

export async function includer(run: Run, params: OpenApiIncluderParams, tocPath: string) {
    const {input, tags = {}} = params;

    const vars = run.vars.for(tocPath);
    const ctx: Context = {
        params,
        vars,
        relative: (path: string) => join(run.input, path),
        tag(id: string) {
            return tags[id];
        },
        refs: new RefsService(),
    };
    const contentPath = join(run.input, input);

    const parser = new SwaggerParser();

    try {
        const data = (await parser.validate(contentPath, {validate: {spec: true}})) as OpenAPISpec;

        for (const file of Object.values(parser.$refs.values())) {
            const schemas = Object.entries(file.components?.schemas || {}).concat(
                Object.entries(file),
            );
            for (const [refName, schema] of schemas) {
                ctx.refs.add(refName, schema as OpenJSONSchema);
            }
        }

        const toc = await generateToc(data, ctx);
        const files = await generateContent(data, ctx);

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

async function generateToc(data: OpenAPISpec, ctx: Context): Promise<YfmToc> {
    const {vars, params} = ctx;
    const {leadingPage, filter} = params;
    const leadingPageName = leadingPage?.name ?? LEADING_PAGE_NAME_DEFAULT;
    const leadingPageMode = leadingPage?.mode ?? LeadingPageMode.Leaf;

    assertLeadingPageMode(leadingPageMode);

    const filterContent = filterUsefullContent(filter, vars);
    const {tags, endpoints} = filterContent(parsers.paths(data, parsers.tags(data)));

    const toc: YfmTocItem & {items: YfmTocItem[]} = {
        name: INCLUDER_NAME,
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
    const rootLadingPageName = root?.name || leadingPageName;

    if (!root?.hidden) {
        addLeadingPage(toc, leadingPageMode, rootLadingPageName, 'index.md');
    }

    return toc as YfmToc;
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

async function generateContent(data: OpenAPISpec, ctx: Context): Promise<EndpointRoute[]> {
    const {vars, params} = ctx;
    const {input, leadingPage, filter, noindex, hidden, sandbox} = params;
    const contentPath = ctx.relative(input);
    const customLeadingPageDir = dirname(contentPath);

    const filterContent = filterUsefullContent(filter, vars);
    const applyNoindex = matchFilter(noindex || {}, vars, (endpoint) => {
        endpoint.noindex = true;
    });

    const applyHidden = matchFilter(hidden || {}, vars, (endpoint) => {
        endpoint.hidden = true;
    });

    const leadingPageSpecRenderMode = leadingPage?.spec?.renderMode ?? SPEC_RENDER_MODE_DEFAULT;
    assertSpecRenderMode(leadingPageSpecRenderMode);

    const results: EndpointRoute[] = [];

    const info: V3Info = parsers.info(data);
    let spec = parsers.paths(data, parsers.tags(data));

    if (noindex) {
        applyNoindex(spec);
    }

    if (hidden) {
        applyHidden(spec);
    }

    spec = filterContent(spec);

    const root = ctx.tag('__root__');

    if (!root?.hidden) {
        const mainContent = root?.path
            ? readFileSync(join(customLeadingPageDir, root.path)).toString()
            : generators.main({data, info, spec, leadingPageSpecRenderMode}, ctx);

        results.push({
            path: 'index.md',
            content: mainContent,
        });
    }

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

function handleEndpointRender(endpoint: V3Endpoint, pathPrefix?: string): YfmToc {
    let path = mdPath(endpoint);
    if (pathPrefix) {
        path = join(pathPrefix, path);
    }
    return {
        href: path,
        name: sectionName(endpoint),
        hidden: endpoint.hidden,
        deprecated: endpoint.deprecated,
    } as YfmToc;
}

export function sectionName(e: V3Endpoint): string {
    return e.summary ?? e.operationId ?? `${e.method} ${e.path}`;
}

export function mdPath(e: V3Endpoint): string {
    return `${e.id}.md`;
}
