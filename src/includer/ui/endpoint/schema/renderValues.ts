import type {JSONSchema, RenderContext} from './jsonSchema';

import {block} from '../../common';

import {decorate, traverseSchemaRefs} from './utils';

function formatLiteral(value: unknown): string {
    if (typeof value === 'string') {
        return value;
    }

    return JSON.stringify(value);
}

interface CollectedValues {
    default?: unknown;
    const?: unknown;
    enumValues: unknown[];
    enumIndex: Set<string>;
}

function createCollector(): CollectedValues {
    return {
        enumValues: [],
        enumIndex: new Set<string>(),
    };
}

export function renderValues(schema: JSONSchema, context: RenderContext): string {
    const collected = createCollector();
    traverseSchemaRefs(schema, context.ref, (current) => {
        if (current.default !== undefined && collected.default === undefined) {
            collected.default = current.default;
        }

        if (current.const !== undefined && collected.const === undefined) {
            collected.const = current.const;
        }

        if (Array.isArray(current.enum) && current.enum.length > 0) {
            for (const value of current.enum) {
                const key = JSON.stringify(value);
                if (!collected.enumIndex.has(key)) {
                    collected.enumIndex.add(key);
                    collected.enumValues.push(value);
                }
            }
        }
    });

    const parts: string[] = [];
    const {i18n} = context;

    const makeLabel = (text: string): string => decorate(`${text}:`, 'json-schema-value');

    if (collected.default !== undefined) {
        parts.push(`${makeLabel(i18n.values.default)} \`${formatLiteral(collected.default)}\``);
    }

    if (collected.const !== undefined) {
        parts.push(`${makeLabel(i18n.values.const)} \`${formatLiteral(collected.const)}\``);
    }

    if (collected.enumValues.length > 0) {
        const items = collected.enumValues.map((value) => `\`${formatLiteral(value)}\``).join(', ');
        parts.push(`${makeLabel(i18n.values.enum)} ${items}`);
    }

    return block(parts);
}
