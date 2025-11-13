import type {JSONSchema, SchemaRenderOptions} from './jsonSchema';

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
import {blocks, unmaskTableContent} from './utils';

export type {JSONSchema} from './jsonSchema';

export type RenderOptions = SchemaRenderOptions;

export function renderSchema(schema: JSONSchema, options: RenderOptions = {}): string {
    const {before = '', after = ''} = options;
    const normalized = normalizeSchema(schema);
    const context = new RenderContext({
        ...options,
        renderSchema,
        isRoot: options.isRoot ?? true,
    });

    const output = blocks([
        before,
        renderTitle(normalized, context),
        renderDeprecated(normalized, context),
        renderType(normalized, context),
        renderCombinators(normalized, context),
        renderDescription(normalized, context),
        renderValues(normalized, context),
        renderAssertions(normalized, context),
        renderExamples(normalized, context),
        after,
    ]);

    return context.isRoot ? unmaskTableContent(output) : output;
}
