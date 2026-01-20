import type {JSONSchema, OrderedProperty, PrimitiveType, RenderContext} from './jsonSchema';

import omit from 'lodash/omit';

import {block, cut, deprecated} from '../../common';
import {isPrimitiveType} from '../utils';

import {hasCombinators} from './renderCombinators';
import {decorate, has, resolveRef, table, unmaskTableContent} from './utils';

const CLASS_NAMES = {
    property: 'json-schema-property',
    additionalProperty: 'json-schema-additional-property',
    patternProperty: 'json-schema-pattern-property',
    requiredProperty: 'json-schema-required',
    deprecatedProperty: 'json-schema-deprecated',
} as const;

const NULL_PATTERN = /(^|\W)null(\W|$)/i;
const TYPE_LINE_PATTERN = /^(\*\*[^\n:]+:\s*)([^\n]+)([\s\S]*)$/;

export interface RenderTypeOptions {
    suffix?: string;
}

function addNullableVariant(value: string, schema: JSONSchema): string {
    if (!schema.nullable || NULL_PATTERN.test(value)) {
        return value;
    }

    return `${value} | null`;
}

function formatTypeValue(base: string, schema: JSONSchema, suffix = ''): string {
    const combined = suffix ? `${base}${suffix}` : base;
    return addNullableVariant(combined, schema);
}

function applyNullableToRenderedOutput(output: string, schema: JSONSchema): string {
    if (!schema.nullable) {
        return output;
    }

    return output.replace(TYPE_LINE_PATTERN, (_match, prefix, value, rest) => {
        return `${prefix}${addNullableVariant(value.trim(), schema)}${rest}`;
    });
}

// eslint-disable-next-line complexity
export function renderType(
    schema: JSONSchema | undefined,
    context: RenderContext,
    options: RenderTypeOptions = {},
): string {
    const {suffix = ''} = options;
    const {ref} = context;
    const {i18n} = context;

    if (!schema) {
        return `**${i18n.type}**: unknown${suffix}`;
    }

    if (isPrimitiveType(schema)) {
        const hasFormat =
            schema.type === 'string' && 'format' in schema && typeof schema.format === 'string';
        const baseType = hasFormat
            ? `string&lt;${schema.format}&gt;`
            : (schema.type as PrimitiveType);
        const typeValue = formatTypeValue(baseType, schema, suffix);
        return `**${i18n.type}**: ${typeValue}`;
    }

    if (schema.$ref) {
        const resolved = resolveRef(schema, ref);
        if (!resolved) {
            return `**${i18n.type}**: unknown${suffix}`;
        }

        const typeValue = formatTypeValue(`[${resolved.label}](${resolved.href})`, schema, suffix);
        return `**${i18n.type}**: ${typeValue}`;
    }

    if (schema.type === 'object') {
        if (
            has(schema, 'properties') ||
            has(schema, 'additionalProperties') ||
            has(schema, 'patternProperties')
        ) {
            // Don't use title in cut block if suppressTitle is set (e.g., in combinator variants)
            const baseTypeLabel = schema.title
                ? addNullableVariant(schema.title, schema)
                : formatTypeValue('object', schema, suffix);
            const typeLabel = `**${i18n.type}**: ${baseTypeLabel}`;
            const content = renderObjectType(schema, context);

            if (context.expandType === true) {
                if (schema.nullable) {
                    return block([typeLabel, content]);
                }
                return content;
            }

            if (context.expandType === 'titled') {
                return block([typeLabel, content]);
            }

            return cut(content, typeLabel);
        }

        const typeValue = formatTypeValue('object', schema, suffix);
        return `**${i18n.type}**: ${typeValue}`;
    }

    if (schema.type === 'array') {
        return renderArrayType(schema, context, options);
    }

    if (Array.isArray(schema.type)) {
        const joined = schema.type.join(' | ');
        const baseValue = suffix ? `(${joined})${suffix}` : joined;
        const typeValue = addNullableVariant(baseValue, schema);
        return `**${i18n.type}**: ${typeValue}`;
    }

    if (typeof schema.type === 'string') {
        const typeValue = formatTypeValue(schema.type, schema, suffix);
        return `**${i18n.type}**: ${typeValue}`;
    }

    if (hasCombinators(schema)) {
        return '';
    }

    return `**${i18n.type}**: unknown${suffix}`;
}

function shouldRenderProperty(property: JSONSchema | undefined, context: RenderContext): boolean {
    if (!property) {
        return true;
    }

    if (property['x-hidden'] === true) {
        return false;
    }

    if (context.writeOnly && property.readOnly === true) {
        return false;
    }

    if (context.readOnly && property.writeOnly === true) {
        return false;
    }

    return true;
}

function defaultOrderProperties(schema: JSONSchema): OrderedProperty[] {
    if (!has(schema, 'properties')) {
        return [];
    }

    const requiredSet = new Set(schema.required ?? []);

    return Object.entries(schema.properties)
        .map(([name, value]) => ({
            name,
            schema: value ?? {},
            required: requiredSet.has(name),
        }))
        .sort((a, b) => {
            if (a.required !== b.required) {
                return a.required ? -1 : 1;
            }

            return a.name.localeCompare(b.name, undefined, {sensitivity: 'base'});
        })
        .map(({name, schema}) => ({name, schema}));
}

function resolveOrderedProperties(schema: JSONSchema, context: RenderContext): OrderedProperty[] {
    const ordered = context.orderProperties?.(schema);
    if (ordered && ordered.length > 0) {
        return ordered;
    }

    return defaultOrderProperties(schema);
}

export function renderObjectType(schema: JSONSchema, context: RenderContext): string {
    const {renderSchema} = context;
    const rows: Array<string | [string, string]> = [];
    const requiredSet = new Set(schema.required ?? []);
    const propertyContext = context.clone({
        suppressTableHeaders: true,
    });

    const {i18n} = context;

    if (!context.suppressTableHeaders) {
        rows.push(`|| **${i18n.name}** | **${i18n.description}** ||`);
    }

    if (has(schema, 'properties')) {
        const orderedProperties = resolveOrderedProperties(schema, context);

        for (const {name: key, schema: value} of orderedProperties) {
            if (!shouldRenderProperty(value, context)) {
                continue;
            }

            let label = decorate(
                key,
                CLASS_NAMES.property,
                requiredSet.has(key) ? CLASS_NAMES.requiredProperty : undefined,
                value?.deprecated ? CLASS_NAMES.deprecatedProperty : undefined,
            );

            if (value?.deprecated) {
                label += deprecated({compact: true});
            }

            const propertyOptions = {
                ...propertyContext.toOptions(),
                suppressDeprecatedWarning: value?.deprecated,
            };

            rows.push([label, renderSchema(value ?? {}, propertyOptions)]);
        }
    }

    if (has(schema, 'additionalProperties')) {
        const additional = schema.additionalProperties;

        if (!context.suppressVerboseAdditional) {
            if (additional === true) {
                rows.push([
                    decorate(i18n.additional, CLASS_NAMES.additionalProperty),
                    `**${i18n.type}**: any`,
                ]);
            } else if (additional === false) {
                rows.push([
                    decorate(i18n.additional, CLASS_NAMES.additionalProperty),
                    `**${i18n.type}**: never`,
                ]);
            }
        }

        if (typeof additional === 'object' && additional !== null) {
            rows.push([
                decorate(i18n.additional, CLASS_NAMES.additionalProperty),
                renderSchema(additional, propertyContext.toOptions()),
            ]);
        }
    }

    if (has(schema, 'patternProperties')) {
        for (const [pattern, value] of Object.entries(schema.patternProperties)) {
            rows.push([
                decorate(`/${pattern}/`, CLASS_NAMES.patternProperty),
                renderSchema(value, propertyContext.toOptions()),
            ]);
        }
    }

    const tableContent = table(rows, {classes: ['json-schema-properties']});

    return context.isRoot ? unmaskTableContent(tableContent) : tableContent;
}

function renderArrayType(
    schema: JSONSchema,
    context: RenderContext,
    typeOptions: RenderTypeOptions,
): string {
    const {i18n} = context;
    let suffix = typeOptions.suffix || '';
    let target: JSONSchema | undefined = schema;
    let depth = 0;
    let encounteredTuple = false;

    while (target && target.type === 'array') {
        if (Array.isArray(target.items)) {
            depth += 1;
            encounteredTuple = true;
            break;
        }

        depth += 1;
        target = target.items;
    }

    suffix += '[]'.repeat(depth);

    if (encounteredTuple) {
        const typeValue = formatTypeValue('unknown', schema, suffix);
        return `**${i18n.type}**: ${typeValue}`;
    }

    const rendered = renderType(target, context, {suffix});

    if (rendered.trim() === '') {
        // Fallback for arrays whose items are defined only via combinators (`oneOf`/`allOf`/`anyOf`)
        // without an explicit type: render a cut block with a generic `array` label
        // and delegate detailed rendering of the array schema (excluding type block) to show
        // combinators, description, examples, etc. Examples will be shown once inside the cut,
        // not duplicated on the top level or in each combinator variant.
        const baseTypeLabel = addNullableVariant('array', schema);
        const typeLabel = `**${i18n.type}**: ${baseTypeLabel}`;

        const nestedContext = context.clone({
            suppressTitle: true,
            expandType: 'titled',
        });

        // Render the full array schema, but skip the type block (already rendered in cut title)
        // Examples and description should NOT be rendered at the array cut level for combinator-based arrays
        // They should be rendered at the table cell level (when array is a property) or in variants
        // We need to render items.oneOf as if it were schema.oneOf for combinators to work
        // Remove type, example, examples, and description to avoid rendering them at the array level
        const schemaWithCombinators = {
            ...omit(schema, ['type', 'example', 'examples', 'description']),
            oneOf: target?.oneOf,
            allOf: target?.allOf,
            anyOf: target?.anyOf,
        };

        // Render combinators, values, assertions, but NOT examples and description
        // Examples and description should be rendered at the table cell level (when array is a property)
        // or within each oneOf variant, not at the array cut level
        const nestedOptions = nestedContext.toOptions();
        const content = context.renderSchema(schemaWithCombinators, {
            ...nestedOptions,
            blocks: ['combinators', 'values', 'assertions'],
        });

        return cut(content, typeLabel);
    }

    return applyNullableToRenderedOutput(rendered, schema);
}
