import type {OpenApiBuildConfig, OpenApiIncluderParams, Run} from '../includer/models';

import {describe, expect, it, vi} from 'vitest';
import nodeFS from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {includer} from '../includer';

import {DocumentBuilder} from './__helpers__/run';

type IncludeResult = {
    files: Map<string, string>;
    infoLogs: string[];
    /** Expected companion file name derived from the input spec name. */
    companion: string;
};

async function include(
    spec: string,
    options: Partial<OpenApiIncluderParams> = {},
    config?: OpenApiBuildConfig,
): Promise<IncludeResult> {
    const id = Math.ceil(Math.random() * 10000000);
    const tempRoot = nodeFS.mkdtempSync(join(tmpdir(), 'openapi-companion-'));
    const infoLogs: string[] = [];

    const params = {input: `spec-${id}.yaml`, ...options};
    const companion = params.input.replace(/\.[^.]+$/, '') + '.openapi.json';
    const run = {
        input: tempRoot,
        config,
        logger: {
            info: (message: string) => infoLogs.push(message),
            warn: vi.fn(),
        },
        read: async () => '',
        vars: {for: vi.fn()},
    } as unknown as Run;

    nodeFS.writeFileSync(join(tempRoot, params.input), spec);

    try {
        const {files} = await includer(run, params, join(tempRoot, 'toc.yaml'));
        const map = new Map(files.map(({path, content}) => [path, content]));

        return {files: map, infoLogs, companion};
    } finally {
        nodeFS.rmSync(tempRoot, {recursive: true, force: true});
    }
}

function spec(): string {
    return new DocumentBuilder('test').response(200, {description: 'ok'}).build();
}

describe('OpenAPI companion render mode', () => {
    it('derives the companion file name from the source spec name', async () => {
        const {files, companion} = await include(spec(), {input: 'petstore.yaml'});

        expect(companion).toBe('petstore.openapi.json');
        expect(files.has('petstore.openapi.json')).toBe(true);
        expect(files.has('index.openapi.json')).toBe(false);
    });

    it('emits the companion file and keeps inline spec for small specs by default', async () => {
        const {files, companion} = await include(spec());

        expect(files.has(companion)).toBe(true);
        expect(files.get('index.md')).toContain('{% cut');
        expect(files.get('index.md')).not.toContain(`(${companion})`);
    });

    it('renders a link to the companion when renderMode is "link"', async () => {
        const {files, companion} = await include(spec(), {
            leadingPage: {spec: {renderMode: 'link'}},
        });

        expect(files.has(companion)).toBe(true);
        expect(files.get('index.md')).toContain(`(${companion})`);
        expect(files.get('index.md')).not.toContain('{% cut');
    });

    it('does not render or emit the spec when renderMode is "hidden"', async () => {
        const {files, companion} = await include(spec(), {
            leadingPage: {spec: {renderMode: 'hidden'}},
        });

        expect(files.has(companion)).toBe(false);
        expect(files.get('index.md')).not.toContain('{% cut');
        expect(files.get('index.md')).not.toContain(`(${companion})`);
    });

    it('auto-switches inline -> link when the spec exceeds maxOpenapiIncludeInlineSize', async () => {
        const {files, infoLogs, companion} = await include(spec(), undefined, {
            content: {maxOpenapiIncludeInlineSize: 1},
        });

        expect(files.get('index.md')).toContain(`(${companion})`);
        expect(files.get('index.md')).not.toContain('{% cut');
        expect(infoLogs.some((line) => line.includes("changed from 'inline' to 'link'"))).toBe(
            true,
        );
    });

    it('always uses link mode when maxOpenapiIncludeInlineSize is 0', async () => {
        const {files, companion} = await include(spec(), undefined, {
            content: {maxOpenapiIncludeInlineSize: 0},
        });

        expect(files.get('index.md')).toContain(`(${companion})`);
    });

    it('does not emit the companion when ai.openapiCompanions is false', async () => {
        const {files, companion} = await include(
            spec(),
            {leadingPage: {spec: {renderMode: 'link'}}},
            {
                ai: {openapiCompanions: false},
            },
        );

        expect(files.has(companion)).toBe(false);
        // Falls back to embedding to avoid a dead link.
        expect(files.get('index.md')).toContain('{% cut');
    });

    it('emits the companion in md2html only when ai.openapiCompanions is true', async () => {
        const onlyMd = await include(spec(), undefined, {
            outputFormat: 'html',
            ai: {openapiCompanions: 'md'},
        });
        expect(onlyMd.files.has(onlyMd.companion)).toBe(false);

        const both = await include(spec(), undefined, {
            outputFormat: 'html',
            ai: {openapiCompanions: true},
        });
        expect(both.files.has(both.companion)).toBe(true);
    });

    it('does not emit the companion when it exceeds maxOpenapiIncludeSize', async () => {
        const {files, companion} = await include(spec(), undefined, {
            content: {maxOpenapiIncludeSize: 1},
        });

        expect(files.has(companion)).toBe(false);
    });
});
