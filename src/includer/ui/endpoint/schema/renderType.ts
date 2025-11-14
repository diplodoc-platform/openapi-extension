import type {JSONSchema, PrimitiveType, RenderContext} from './jsonSchema';

import {deprecated} from '../../popups';
import {block, cut} from '../../common';
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

export interface RenderTypeOptions {
    suffix?: string;
}

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
        const baseType = hasFormat ? `string<${schema.format}>` : (schema.type as PrimitiveType);
        return `**${i18n.type}**: ${baseType}${suffix}`;
    }

    if (schema.$ref) {
        const resolved = resolveRef(schema, ref);
        if (!resolved) {
            return `**${i18n.type}**: unknown${suffix}`;
        }

        return `**${i18n.type}**: [${resolved.label}](${resolved.href})${suffix}`;
    }

    if (schema.type === 'object') {
        if (
            has(schema, 'properties') ||
            has(schema, 'additionalProperties') ||
            has(schema, 'patternProperties')
        ) {
            // Don't use title in cut block if suppressTitle is set (e.g., in combinator variants)
            const typeLabel = schema.title
                ? `**${i18n.type}**: ${schema.title}`
                : `**${i18n.type}**: object${suffix}`;
            const content = renderObjectType(schema, context);

            if (context.expandType === true) {
                return content;
            }

            if (context.expandType === 'titled') {
                return block([typeLabel, content]);
            }

            return cut(content, typeLabel);
        }

        return `**${i18n.type}**: object${suffix}`;
    }

    if (schema.type === 'array') {
        return renderArrayType(schema, context, options);
    }

    if (Array.isArray(schema.type)) {
        const joined = schema.type.join(' | ');
        return suffix ? `**${i18n.type}**: (${joined})${suffix}` : `**${i18n.type}**: ${joined}`;
    }

    if (typeof schema.type === 'string') {
        return `**${i18n.type}**: ${schema.type}${suffix}`;
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

    if (context.writeOnly && property.readOnly === true) {
        return false;
    }

    if (context.readOnly && property.writeOnly === true) {
        return false;
    }

    return true;
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
        for (const [key, value] of Object.entries(schema.properties)) {
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

            rows.push([
                label,
                renderSchema(value, {
                    ...propertyContext.toOptions(),
                    suppressDeprecatedWarning: value.deprecated,
                }),
            ]);
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
        const {i18n} = context;
        return `**${i18n.type}**: unknown${suffix}`;
    }

    return renderType(target, context, {suffix});
}
