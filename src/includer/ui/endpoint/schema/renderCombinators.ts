import type {JSONSchema, RenderContext} from './jsonSchema';

import {block, cut} from '../../common';

type CombinatorLabelKey = keyof RenderContext['i18n']['combinators'];

function buildCombinatorTitle(
    variants: JSONSchema[],
    labelKey: CombinatorLabelKey,
    context: RenderContext,
): string {
    const {combinators} = context.i18n;
    const label = combinators[labelKey];
    const titles = variants
        .map((variant) => variant.title)
        .filter((title): title is string => Boolean(title));

    if (titles.length === variants.length && titles.length > 0) {
        const separator = labelKey === 'allOf' ? ' **and** ' : ' **or** ';
        return `**${label}**: ${titles.join(separator)}`;
    }

    const count = variants.length;
    return `**${label} ${count} ${count === 1 ? 'type' : 'types'}**`;
}

function renderCombinatorList(
    variants: JSONSchema[] | undefined,
    context: RenderContext,
    labelKey: CombinatorLabelKey,
): string {
    if (!variants || variants.length === 0) {
        return '';
    }

    const title = buildCombinatorTitle(variants, labelKey, context);

    const items = variants
        .map((variant) => {
            // Suppress title and table headers in variant rendering
            const variantContext = context.clone({
                suppressTitle: false,
                suppressTableHeaders: true,
                expandType: 'titled',
            });
            const rendered = context.renderSchema(variant, variantContext.toOptions());
            const lines = rendered.trimEnd().split('\n');
            const [first = '', ...rest] = lines;

            // Build bullet point
            const bulletLines: string[] = [`- ${first}`];

            if (rest.length > 0) {
                bulletLines.push(
                    rest.map((line) => (line.length > 0 ? `  ${line}` : '')).join('\n'),
                );
            }

            return bulletLines.join('\n');
        })
        .join('\n\n');

    const separator = labelKey === 'allOf' ? 'and' : 'or';

    return cut(items, title, ['.json-schema-combinators', 'data-marker=' + separator]);
}

export function renderOneOf(schema: JSONSchema, context: RenderContext): string {
    return renderCombinatorList(schema.oneOf, context, 'oneOf');
}

export function renderAllOf(schema: JSONSchema, context: RenderContext): string {
    return renderCombinatorList(schema.allOf, context, 'allOf');
}

export function renderAnyOf(schema: JSONSchema, context: RenderContext): string {
    return renderCombinatorList(schema.anyOf, context, 'anyOf');
}

export function hasCombinators(schema: JSONSchema): boolean {
    return Boolean(
        (schema.oneOf && schema.oneOf.length > 0) ||
            (schema.allOf && schema.allOf.length > 0) ||
            (schema.anyOf && schema.anyOf.length > 0),
    );
}

export function renderCombinators(schema: JSONSchema, context: RenderContext): string {
    if (!hasCombinators(schema)) {
        return '';
    }

    return block([
        renderOneOf(schema, context),
        renderAllOf(schema, context),
        renderAnyOf(schema, context),
    ]);
}
