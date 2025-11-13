import type {JSONSchema, PrimitiveType, RenderContext} from './jsonSchema';

import {deprecated} from '../../popups';

import {hasCombinators} from './renderCombinators';
import {
    blocks,
    cut,
    decorate,
    escapeTableText,
    has,
    isPrimitiveType,
    maskTablePipes,
    resolveRef,
    table,
    unmaskTableContent,
} from './utils';

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

function prepareTableCell(content: string, _context: RenderContext): string {
    if (!content) {
        return content;
    }

    if (content.includes('#|')) {
        return maskTablePipes(content);
    }

    return escapeTableText(content);
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
                return blocks([typeLabel, content]);
            }

            return cut(typeLabel, content);
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

            const preparedLabel = prepareTableCell(label, context);
            const preparedValue = prepareTableCell(
                renderSchema(value, {
                    ...propertyContext.toOptions(),
                    suppressDeprecatedWarning: value.deprecated,
                }),
                context,
            );

            rows.push([preparedLabel, preparedValue]);
        }
    }

    if (has(schema, 'additionalProperties')) {
        const additional = schema.additionalProperties;

        if (!context.suppressVerboseAdditional) {
            if (additional === true) {
                rows.push([
                    prepareTableCell(
                        decorate(i18n.additional, CLASS_NAMES.additionalProperty),
                        context,
                    ),
                    prepareTableCell(`**${i18n.type}**: any`, context),
                ]);
            } else if (additional === false) {
                rows.push([
                    prepareTableCell(
                        decorate(i18n.additional, CLASS_NAMES.additionalProperty),
                        context,
                    ),
                    prepareTableCell(`**${i18n.type}**: never`, context),
                ]);
            }
        }

        if (typeof additional === 'object' && additional !== null) {
            const preparedLabel = prepareTableCell(
                decorate(i18n.additional, CLASS_NAMES.additionalProperty),
                context,
            );
            const preparedValue = prepareTableCell(
                renderSchema(additional, propertyContext.toOptions()),
                context,
            );
            rows.push([preparedLabel, preparedValue]);
        }
    }

    if (has(schema, 'patternProperties')) {
        for (const [pattern, value] of Object.entries(schema.patternProperties)) {
            const preparedLabel = prepareTableCell(
                decorate(`/${pattern}/`, CLASS_NAMES.patternProperty),
                context,
            );
            const preparedValue = prepareTableCell(
                renderSchema(value, propertyContext.toOptions()),
                context,
            );
            rows.push([preparedLabel, preparedValue]);
        }
    }

    const tableContent = table(rows, {classes: ['json-schema-properties']});

    return context.isRoot ? unmaskTableContent(tableContent) : maskTablePipes(tableContent);
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
