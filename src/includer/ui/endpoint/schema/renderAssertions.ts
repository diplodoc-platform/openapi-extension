import type {JSONSchema, RenderContext} from './jsonSchema';

import {block} from '../../common';

import {decorate, traverseSchemaRefs} from './utils';

const ASSERTION_CLASS = 'json-schema-assertion';

type SchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';

type AssertionKey =
    | 'minimum'
    | 'maximum'
    | 'exclusiveMinimum'
    | 'exclusiveMaximum'
    | 'minLength'
    | 'maxLength'
    | 'pattern'
    | 'format'
    | 'minItems'
    | 'maxItems'
    | 'uniqueItems'
    | 'minProperties'
    | 'maxProperties';

type AssertionValue = string | number | boolean;

type AssertionLabelKey = keyof RenderContext['i18n']['assertions'];

interface AssertionSpec {
    key: AssertionKey;
    labelKey: AssertionLabelKey;
    types?: SchemaType[];
}

const assertionsMap: AssertionSpec[] = [
    {key: 'minimum', labelKey: 'minValue', types: ['number', 'integer']},
    {key: 'maximum', labelKey: 'maxValue', types: ['number', 'integer']},
    {key: 'exclusiveMinimum', labelKey: 'exclusiveMin', types: ['number', 'integer']},
    {key: 'exclusiveMaximum', labelKey: 'exclusiveMax', types: ['number', 'integer']},
    {key: 'minLength', labelKey: 'minLength', types: ['string']},
    {key: 'maxLength', labelKey: 'maxLength', types: ['string']},
    {key: 'pattern', labelKey: 'pattern', types: ['string']},
    {key: 'minItems', labelKey: 'minItems', types: ['array']},
    {key: 'maxItems', labelKey: 'maxItems', types: ['array']},
    {key: 'uniqueItems', labelKey: 'uniqueItems', types: ['array']},
    {key: 'minProperties', labelKey: 'minProperties', types: ['object']},
    {key: 'maxProperties', labelKey: 'maxProperties', types: ['object']},
];

const allowedTypes: SchemaType[] = ['string', 'number', 'integer', 'boolean', 'array', 'object'];

function extractSchemaTypes(schema: JSONSchema): SchemaType[] | undefined {
    const {type} = schema;
    if (typeof type === 'string') {
        return allowedTypes.includes(type as SchemaType) ? [type as SchemaType] : undefined;
    }

    if (Array.isArray(type)) {
        const filtered = type.filter((value): value is SchemaType =>
            allowedTypes.includes(value as SchemaType),
        );
        return filtered.length > 0 ? filtered : undefined;
    }

    return undefined;
}

function isApplicable(spec: AssertionSpec, schemaTypes: SchemaType[] | undefined): boolean {
    if (!spec.types || spec.types.length === 0) {
        return true;
    }

    if (!schemaTypes || schemaTypes.length === 0) {
        return false;
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return schemaTypes.some((schemaType) => spec.types!.includes(schemaType));
}

interface CollectedAssertion {
    value: AssertionValue;
    types?: SchemaType[];
}

export function renderAssertions(schema: JSONSchema, context: RenderContext): string {
    const collected = new Map<AssertionKey, CollectedAssertion>();

    traverseSchemaRefs(schema, context.ref, (current) => {
        const currentTypes = extractSchemaTypes(current);

        for (const spec of assertionsMap) {
            if (collected.has(spec.key)) {
                continue;
            }

            const value = current[spec.key];
            if (value !== undefined) {
                collected.set(spec.key, {
                    value: value as AssertionValue,
                    types: currentTypes,
                });
            }
        }
    });

    const parts: string[] = [];

    for (const spec of assertionsMap) {
        const entry = collected.get(spec.key);
        if (!entry) {
            continue;
        }

        if (spec.key === 'uniqueItems' && entry.value !== true) {
            continue;
        }

        if (!isApplicable(spec, entry.types)) {
            continue;
        }

        const label = context.i18n.assertions[spec.labelKey];
        const decoratedLabel = decorate(`${label}:`, ASSERTION_CLASS);
        parts.push(`${decoratedLabel} \`${entry.value}\``);
    }

    return block(parts);
}
