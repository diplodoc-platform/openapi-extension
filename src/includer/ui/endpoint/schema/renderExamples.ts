import type {JSONSchema, RenderContext} from './jsonSchema';

import {block, code, cut} from '../../common';

import {decorate, traverseSchemaRefs} from './utils';

const FORMAT_SAMPLES: Record<string, string> = {
    email: 'user@example.com',
    'date-time': '2025-01-01T00:00:00Z',
    date: '2025-01-01',
    time: '12:00:00',
    uri: 'https://example.com',
    url: 'https://example.com',
    hostname: 'example.com',
    ipv4: '192.168.0.1',
    ipv6: '2001:db8::1',
    uuid: '123e4567-e89b-12d3-a456-426614174000',
};

const MAX_DEPTH = 5;

// Common pattern examples for better readability
const PATTERN_EXAMPLES: Record<string, string> = {
    '^[0-9]{5}$': '12345',
    '^[0-9]{5}(-[0-9]{4})?$': '12345-6789',
    '^[A-Z]{2}[0-9]{5}$': 'AB12345',
    '^[a-z]+$': 'example',
    '^[A-Z]+$': 'EXAMPLE',
    '^[0-9]+$': '123',
    '^[a-zA-Z0-9]+$': 'abc123',
    '^\\d{4}-\\d{2}-\\d{2}$': '2025-01-15',
    '^#[0-9a-fA-F]{6}$': '#FF5733',
    '^\\+?[0-9\\s-()]+$': '+7 (555) 123-4567',
};

function generatePatternExample(pattern: string): string | undefined {
    // Check for exact match in known patterns
    if (PATTERN_EXAMPLES[pattern]) {
        return PATTERN_EXAMPLES[pattern];
    }

    // Try to generate simple examples from common pattern elements
    // This is a simplified heuristic, not a full regex generator

    // Numbers: ^[0-9]{N}$ or ^\d{N}$
    const digitMatch = pattern.match(/^\^?\\?d?\[0-9\]\{(\d+)\}\$?$/);
    if (digitMatch) {
        const length = parseInt(digitMatch[1], 10);
        return '1'.repeat(Math.min(length, 10));
    }

    // Letters: ^[a-z]{N}$ or ^[A-Z]{N}$
    const letterMatch = pattern.match(/^\^?\[([a-zA-Z]-[a-zA-Z])\]\{(\d+)\}\$?$/);
    if (letterMatch) {
        const length = parseInt(letterMatch[2], 10);
        const isUpper = letterMatch[1].includes('A-Z');
        return (isUpper ? 'A' : 'a').repeat(Math.min(length, 10));
    }

    // Alphanumeric: ^[a-zA-Z0-9]{N}$
    const alphanumMatch = pattern.match(/^\^?\[a-zA-Z0-9\]\{(\d+)\}\$?$/);
    if (alphanumMatch) {
        const length = parseInt(alphanumMatch[1], 10);
        return 'abc123'.slice(0, Math.min(length, 10)).padEnd(Math.min(length, 10), 'x');
    }

    return undefined;
}

interface GenerationState {
    depth: number;
    seenRefs: Set<string>;
}

interface Collector {
    list: unknown[];
    keys: Set<string>;
}

function createCollector(): Collector {
    return {
        list: [],
        keys: new Set<string>(),
    };
}

function stableStringify(value: unknown): string {
    return JSON.stringify(value, (_key, current) => {
        if (current && typeof current === 'object' && !Array.isArray(current)) {
            const sorted: Record<string, unknown> = {};
            for (const key of Object.keys(current as Record<string, unknown>).sort()) {
                sorted[key] = (current as Record<string, unknown>)[key];
            }
            return sorted;
        }
        return current;
    });
}

function addExample(collector: Collector, value: unknown): void {
    if (value === undefined) {
        return;
    }

    const key = stableStringify(value);
    if (collector.keys.has(key)) {
        return;
    }

    collector.keys.add(key);
    collector.list.push(value);
}

function isPropertyVisible(property: JSONSchema | undefined, context: RenderContext): boolean {
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

function inferType(schema: JSONSchema | undefined): string | undefined {
    if (!schema) {
        return undefined;
    }

    if (typeof schema.type === 'string') {
        return schema.type;
    }

    if (Array.isArray(schema.type) && schema.type.length > 0) {
        const first = schema.type.find(
            (candidate): candidate is string => typeof candidate === 'string',
        );
        if (first) {
            return first;
        }
    }

    if (schema.properties || schema.patternProperties || schema.additionalProperties) {
        return 'object';
    }

    if (schema.items) {
        return 'array';
    }

    return undefined;
}

function incrementNumeric(base: number, isInteger: boolean): number {
    if (isInteger) {
        return Math.trunc(base) + 1;
    }

    return base + 0.1;
}

function ensureUniqueValue(base: unknown, index: number): unknown {
    if (index === 0) {
        return base;
    }

    if (typeof base === 'number') {
        return base + index;
    }

    if (typeof base === 'string') {
        return `${base}${index}`;
    }

    if (typeof base === 'boolean') {
        return index % 2 === 0 ? base : !base;
    }

    if (Array.isArray(base)) {
        return [...base, index];
    }

    if (base && typeof base === 'object') {
        return {...(base as Record<string, unknown>), _index: index};
    }

    return base;
}

function hasStringEnum(schema: JSONSchema, context: RenderContext): boolean {
    let found = false;

    traverseSchemaRefs(schema, context.ref, (current) => {
        if (found) {
            return;
        }

        if (Array.isArray(current.enum) && current.enum.length > 0) {
            found = current.enum.every((value) => typeof value === 'string');
        }
    });

    return found;
}

function pickDirectExample(schema: JSONSchema): unknown | undefined {
    if (schema.example !== undefined) {
        return schema.example;
    }

    if (Array.isArray(schema.examples) && schema.examples.length > 0) {
        return schema.examples[0];
    }

    if (schema.const !== undefined) {
        return schema.const;
    }

    if (Array.isArray(schema.enum) && schema.enum.length > 0) {
        return schema.enum[0];
    }

    return undefined;
}

function incrementDepth(state: GenerationState): GenerationState {
    return {
        depth: state.depth + 1,
        seenRefs: state.seenRefs,
    };
}

function resolveRefExample(
    schema: JSONSchema,
    context: RenderContext,
    state: GenerationState,
): unknown | undefined {
    if (!schema.$ref) {
        return undefined;
    }

    if (state.seenRefs.has(schema.$ref)) {
        return undefined;
    }

    state.seenRefs.add(schema.$ref);
    const resolved = context.ref(schema.$ref);
    if (!resolved) {
        return undefined;
    }

    return generateExampleInternal(resolved.schema, context, state);
}

function generateFromCombinators(
    schema: JSONSchema,
    context: RenderContext,
    state: GenerationState,
): unknown | undefined {
    if (Array.isArray(schema.allOf)) {
        for (const variant of schema.allOf) {
            const value = generateExampleInternal(variant, context, incrementDepth(state));
            if (value !== undefined) {
                return value;
            }
        }
    }

    if (Array.isArray(schema.oneOf)) {
        const [variant] = schema.oneOf;
        if (variant) {
            return generateExampleInternal(variant, context, incrementDepth(state));
        }
    }

    if (Array.isArray(schema.anyOf)) {
        const [variant] = schema.anyOf;
        if (variant) {
            return generateExampleInternal(variant, context, incrementDepth(state));
        }
    }

    return undefined;
}

function generateStringExample(schema: JSONSchema): string {
    let value: string;

    if (schema.pattern) {
        const patternExample = generatePatternExample(schema.pattern);
        value =
            patternExample ??
            (schema.format ? FORMAT_SAMPLES[schema.format] : undefined) ??
            'example';
    } else {
        const format = schema.format ? FORMAT_SAMPLES[schema.format] : undefined;
        value = format ?? 'example';
    }

    const min = schema.minLength ?? 0;
    const max = schema.maxLength;

    if (value.length < min) {
        value = value.padEnd(min, 'a');
    }

    if (typeof max === 'number' && value.length > max) {
        value = value.slice(0, max);
    }

    return value;
}

function generateNumericExample(schema: JSONSchema, isInteger: boolean): number {
    const min = schema.minimum ?? schema.exclusiveMinimum ?? undefined;
    const max = schema.maximum ?? schema.exclusiveMaximum ?? undefined;

    if (typeof schema.minimum === 'number') {
        return schema.minimum;
    }

    if (typeof schema.exclusiveMinimum === 'number') {
        return incrementNumeric(schema.exclusiveMinimum, isInteger);
    }

    if (typeof schema.maximum === 'number') {
        return schema.maximum;
    }

    if (typeof schema.exclusiveMaximum === 'number') {
        if (isInteger) {
            return Math.trunc(schema.exclusiveMaximum) - 1;
        }

        return schema.exclusiveMaximum - 0.1;
    }

    if (typeof min === 'number') {
        return min;
    }

    if (typeof max === 'number') {
        return max;
    }

    return isInteger ? 0 : 0.5;
}

function generateArrayExample(
    schema: JSONSchema,
    context: RenderContext,
    state: GenerationState,
): unknown[] {
    const count = Math.max(1, schema.minItems ?? 1);
    const itemSchema = Array.isArray(schema.items) ? schema.items[0] : schema.items;
    const child = generateExampleInternal(itemSchema, context, incrementDepth(state));
    const base = child === undefined ? null : child;

    const result: unknown[] = [];
    for (let index = 0; index < count; index += 1) {
        result.push(schema.uniqueItems ? ensureUniqueValue(base, index) : base);
    }

    return result;
}

function generateObjectExample(
    schema: JSONSchema,
    context: RenderContext,
    state: GenerationState,
): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    if (schema.properties) {
        for (const [key, value] of Object.entries(schema.properties)) {
            if (!isPropertyVisible(value, context)) {
                continue;
            }

            const child = generateExampleInternal(value, context, incrementDepth(state));
            if (child !== undefined) {
                result[key] = child;
            }
        }
    }

    return Object.keys(result).length > 0 ? result : {};
}

function generateExampleByType(
    schema: JSONSchema,
    context: RenderContext,
    state: GenerationState,
): unknown {
    const type = inferType(schema);

    switch (type) {
        case 'string': {
            return generateStringExample(schema);
        }
        case 'integer':
        case 'number': {
            return generateNumericExample(schema, type === 'integer');
        }
        case 'boolean': {
            return true;
        }
        case 'array': {
            return generateArrayExample(schema, context, state);
        }
        case 'object': {
            return generateObjectExample(schema, context, state);
        }
        default:
            return null;
    }
}

function generateExampleInternal(
    schema: JSONSchema | undefined,
    context: RenderContext,
    state: GenerationState,
): unknown {
    if (!schema || state.depth > MAX_DEPTH) {
        return undefined;
    }

    const direct = pickDirectExample(schema);
    if (direct !== undefined) {
        return direct;
    }

    const refExample = resolveRefExample(schema, context, state);
    if (refExample !== undefined) {
        return refExample;
    }

    const combinatorExample = generateFromCombinators(schema, context, state);
    if (combinatorExample !== undefined) {
        return combinatorExample;
    }

    return generateExampleByType(schema, context, state);
}

function generateExample(schema: JSONSchema, context: RenderContext): unknown {
    return generateExampleInternal(schema, context, {
        depth: 0,
        seenRefs: new Set<string>(),
    });
}

function escapeBackticks(value: string): string {
    return value.replace(/`/g, '\\`');
}

export function formatExample(value: unknown): string {
    if (value === null) {
        return '`null`';
    }

    if (typeof value === 'string') {
        return `\`${escapeBackticks(value)}\``;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return `\`${String(value)}\``;
    }

    if (typeof value === 'object') {
        return code(JSON.stringify(value, null, 2), 'json');
    }

    return `\`${String(value)}\``;
}

export function collectExamples(context: RenderContext, schema: JSONSchema) {
    const collector = createCollector();

    traverseSchemaRefs(schema, context.ref, (current) => {
        if (current.example !== undefined) {
            addExample(collector, current.example);
        }

        if (Array.isArray(current.examples)) {
            for (const value of current.examples) {
                addExample(collector, value);
            }
        }
    });

    if (collector.list.length === 0) {
        const generated = generateExample(schema, context);
        if (generated !== undefined) {
            addExample(collector, generated);
        }
    }

    return collector.list;
}

export function renderExamples(schema: JSONSchema, context: RenderContext): string {
    if (context.suppressExamples) {
        return '';
    }

    const schemaType = inferType(schema);

    if (schemaType === 'boolean' || schemaType === 'number' || schemaType === 'integer') {
        return '';
    }

    if ((schemaType === 'string' || schemaType === undefined) && hasStringEnum(schema, context)) {
        return '';
    }

    const examples = collectExamples(context, schema).map(formatExample);

    if (examples.length === 0) {
        return '';
    }

    const labelSource = examples.length === 1 ? context.i18n.example : context.i18n.examples;

    if (examples.length === 1) {
        const [single] = examples;
        if (!single.includes('\n')) {
            const labelText = labelSource.endsWith(':') ? labelSource : `${labelSource}:`;
            const label = decorate(labelText, 'json-schema-example');
            return `${label} ${single}`;
        }
    }

    return cut(block(examples), `**${labelSource}**`, ['.json-schema-example']);
}
