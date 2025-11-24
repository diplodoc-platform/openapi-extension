import type {JSONSchema, RenderBlock, SchemaRenderOptions} from './jsonSchema';

import {block} from '../../common';

import {RenderContext} from './jsonSchema';
import {normalizeSchema} from './normalizeSchema';
import {renderCombinators} from './renderCombinators';
import {renderType} from './renderType';
import {renderTitle} from './renderTitle';
import {renderDeprecated} from './renderDeprecated';
import {renderDescription} from './renderDescription';
import {renderValues} from './renderValues';
import {renderAssertions} from './renderAssertions';
import {renderExamples} from './renderExamples';
import {unmaskTableContent} from './utils';

export type {JSONSchema} from './jsonSchema';

export type RenderOptions = SchemaRenderOptions;

const DEFAULT_BLOCKS: RenderBlock[] = [
    'title',
    'deprecated',
    'type',
    'combinators',
    'description',
    'values',
    'assertions',
    'examples',
];

type BlockRenderer = (schema: JSONSchema, context: RenderContext) => string;

const BLOCK_RENDERERS: Record<Exclude<RenderBlock, '...'>, BlockRenderer> = {
    title: renderTitle,
    deprecated: renderDeprecated,
    type: renderType,
    combinators: renderCombinators,
    description: renderDescription,
    values: renderValues,
    assertions: renderAssertions,
    examples: renderExamples,
};

function resolveBlocks(blocks: RenderBlock[] | undefined): RenderBlock[] {
    if (!blocks || blocks.length === 0) {
        return DEFAULT_BLOCKS;
    }

    const hasEllipsis = blocks.includes('...');
    if (!hasEllipsis) {
        return blocks;
    }

    const ellipsisIndex = blocks.indexOf('...');
    const beforeEllipsis = blocks.slice(0, ellipsisIndex);
    const afterEllipsis = blocks.slice(ellipsisIndex + 1);

    const specifiedBlocks = new Set<RenderBlock>([...beforeEllipsis, ...afterEllipsis]);

    const remainingBlocks = DEFAULT_BLOCKS.filter((block) => !specifiedBlocks.has(block));

    return [...beforeEllipsis, ...remainingBlocks, ...afterEllipsis];
}

export function renderSchema(schema: JSONSchema, options: RenderOptions = {}): string {
    const {before = '', after = ''} = options;
    const normalized = normalizeSchema(schema, {resolveRef: options.ref});
    const context = new RenderContext({
        renderSchema,
        isRoot: true,
        ...options,
    });

    const resolvedBlocks = resolveBlocks(options.blocks);
    const blockOutputs: string[] = [before];

    for (const blockName of resolvedBlocks) {
        if (blockName === '...') {
            continue;
        }

        const renderer = BLOCK_RENDERERS[blockName];
        if (renderer) {
            blockOutputs.push(renderer(normalized, context));
        }
    }

    blockOutputs.push(after);

    const output = block(blockOutputs);

    return context.isRoot ? unmaskTableContent(output) : output;
}
