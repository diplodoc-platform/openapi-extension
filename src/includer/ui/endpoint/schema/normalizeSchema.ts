import type {JSONSchema, RefResolver} from './jsonSchema';

import {traverseSchemaRefs} from './utils';

const COMBINATOR_KEYS = ['oneOf', 'allOf', 'anyOf'] as const;

type CombinatorKey = (typeof COMBINATOR_KEYS)[number];

/**
 * Options that influence schema normalization.
 */
export interface NormalizeOptions {
    /**
     * Custom resolver used to follow `$ref` during normalization.
     * Required for propagating metadata such as `deprecated` from referenced schemas.
     */
    resolveRef?: RefResolver;
}

function definedEntries(schema: JSONSchema): Array<[string, unknown]> {
    return Object.entries(schema).filter(([, value]) => value !== undefined);
}

function normalizeEnumToConst(schema: JSONSchema): JSONSchema {
    if (!Array.isArray(schema.enum) || schema.enum.length !== 1 || schema.const !== undefined) {
        return schema;
    }

    const [value] = schema.enum;
    const {enum: _enum, ...rest} = schema as JSONSchema & {enum: unknown[]};

    return {
        ...rest,
        const: value,
    };
}

function isPlainCombinator(schema: JSONSchema, key: CombinatorKey): boolean {
    const {type: _type, ...rest} = schema;
    const entries = definedEntries(rest);
    return entries.length === 1 && entries[0][0] === key;
}

function cloneWithoutKey(schema: JSONSchema, key: CombinatorKey): JSONSchema {
    const {[key]: _ignored, ...rest} = schema;
    return rest;
}

function allCombinatorVariantsDeprecated(schema: JSONSchema): boolean {
    let hasVariants = false;

    for (const key of COMBINATOR_KEYS) {
        const variants = schema[key];
        if (!variants || variants.length === 0) {
            continue;
        }

        hasVariants = true;

        if (!variants.every((variant) => variant.deprecated === true)) {
            return false;
        }
    }

    return hasVariants;
}

/**
 * Converts `if/then/else` constructs into explicit `oneOf` branches so downstream
 * renderers can treat them like any other combinator.
 */
function normalizeConditional(schema: JSONSchema): JSONSchema {
    if (!schema.if) {
        return schema;
    }

    const {if: _ifSchema, then: thenSchema, else: elseSchema, oneOf, type, ...rest} = schema;

    const conditionalVariants: JSONSchema[] = [];

    // Build "when condition matches" variant
    if (thenSchema) {
        conditionalVariants.push({
            ...thenSchema,
            type: thenSchema.type || type, // Inherit type from parent if not specified
            title: thenSchema.title,
        });
    }

    // Build "when condition doesn't match" variant
    if (elseSchema) {
        conditionalVariants.push({
            ...elseSchema,
            type: elseSchema.type || type, // Inherit type from parent if not specified
            title: elseSchema.title,
        });
    }

    // Merge with existing oneOf
    const allVariants = [...conditionalVariants, ...(oneOf || [])];

    if (allVariants.length === 0) {
        return rest;
    }

    return {
        ...rest,
        type, // Keep type at top level
        oneOf: allVariants,
    };
}

/**
 * Applies normalization to each entry of a schema map (e.g., `properties`, `patternProperties`).
 * Filters out entries with `x-hidden: true`.
 */
function normalizeSchemaMap(
    map: Record<string, JSONSchema> | undefined,
    options: NormalizeOptions,
): Record<string, JSONSchema> | undefined {
    if (!map) {
        return undefined;
    }

    const filtered = Object.fromEntries(
        Object.entries(map)
            .filter(([, value]) => !value['x-hidden'])
            .map(([key, value]) => [key, normalizeSchema(value, options)]),
    );

    return Object.keys(filtered).length > 0 ? filtered : undefined;
}

/**
 * Normalizes array `items`, supporting both tuple definitions and single schema references.
 */
function normalizeArrayItems(
    items: JSONSchema | JSONSchema[] | undefined,
    options: NormalizeOptions,
) {
    if (!items) {
        return undefined;
    }

    if (Array.isArray(items)) {
        return items.map((item) => normalizeSchema(item, options));
    }

    if (typeof items === 'object') {
        return normalizeSchema(items as JSONSchema, options);
    }

    return items;
}

/**
 * Normalizes `additionalProperties` when it is a schema object.
 */
function normalizeAdditionalProperties(
    additional: JSONSchema['additionalProperties'],
    options: NormalizeOptions,
): JSONSchema['additionalProperties'] {
    if (additional && typeof additional === 'object' && !Array.isArray(additional)) {
        return normalizeSchema(additional as JSONSchema, options);
    }

    return additional;
}

/**
 * Recursively flattens nested combinators of the same type to avoid redundant levels.
 */
function flattenCombinatorVariants(
    key: CombinatorKey,
    variants: JSONSchema[],
    options: NormalizeOptions,
): JSONSchema[] {
    return variants.flatMap((variant) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (isPlainCombinator(variant, key) && variant[key] && variant[key]!.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return variant[key]!.map((inner) => normalizeSchema(inner, options));
        }

        return [variant];
    });
}

/**
 * Returns `true` if a combinator can be replaced with its single variant.
 */
function shouldCollapseSingleVariant(
    schema: JSONSchema,
    key: CombinatorKey,
    variants: JSONSchema[],
): boolean {
    return variants.length === 1 && isPlainCombinator(schema, key);
}

/**
 * Normalizes a specific combinator key (`oneOf`, `allOf`, `anyOf`).
 */
function normalizeCombinator(
    schema: JSONSchema,
    key: CombinatorKey,
    options: NormalizeOptions,
): JSONSchema {
    const variants = schema[key];

    if (!variants || variants.length === 0) {
        if (variants && variants.length === 0) {
            return cloneWithoutKey(schema, key);
        }
        return schema;
    }

    const normalizedVariants = variants.map((variant) => normalizeSchema(variant, options));
    const flattened = flattenCombinatorVariants(key, normalizedVariants, options);

    if (flattened.length === 0) {
        return cloneWithoutKey(schema, key);
    }

    const updated: JSONSchema = {
        ...schema,
        [key]: flattened,
    };

    if (shouldCollapseSingleVariant(updated, key, flattened)) {
        return normalizeSchema(cloneWithoutKey(flattened[0], key), options);
    }

    return updated;
}

/**
 * Normalizes all combinators defined on the schema.
 */
function normalizeCombinators(schema: JSONSchema, options: NormalizeOptions): JSONSchema {
    return COMBINATOR_KEYS.reduce(
        (current, key) => normalizeCombinator(current, key, options),
        schema,
    );
}

/**
 * Recursively normalizes nested nodes (properties, patternProperties, additionalProperties, items).
 */
function normalizeNestedSchemas(schema: JSONSchema, options: NormalizeOptions): JSONSchema {
    let result = schema;

    const properties = normalizeSchemaMap(result.properties, options);
    if (properties) {
        result = {
            ...result,
            properties,
        };
    }

    const patternProperties = normalizeSchemaMap(result.patternProperties, options);
    if (patternProperties) {
        result = {
            ...result,
            patternProperties,
        };
    }

    const additionalProperties = normalizeAdditionalProperties(
        result.additionalProperties,
        options,
    );
    if (additionalProperties !== result.additionalProperties) {
        result = {
            ...result,
            additionalProperties,
        };
    }

    const items = normalizeArrayItems(result.items, options);
    if (items !== undefined) {
        result = {
            ...result,
            items,
        };
    }

    return result;
}

/**
 * Marks a schema as deprecated if any schema in its `$ref` chain is deprecated.
 */
function markDeprecatedFromRefs(schema: JSONSchema, resolver: RefResolver | undefined): JSONSchema {
    if (!resolver) {
        return schema;
    }

    let isDeprecated = schema.deprecated === true;

    if (!isDeprecated) {
        traverseSchemaRefs(schema, resolver, (current) => {
            if (current !== schema && current.deprecated === true) {
                isDeprecated = true;
            }
        });
    }

    if (isDeprecated && schema.deprecated !== true) {
        return {
            ...schema,
            deprecated: true,
        };
    }

    return schema;
}

/**
 * Produces a normalized version of the provided schema:
 * - collapses single-value enums into `const`
 * - converts `if/then/else` into `oneOf` variants
 * - flattens and deduplicates combinators (`oneOf`, `allOf`, `anyOf`)
 * - recursively normalizes nested objects, arrays, pattern/additional properties
 * - marks schemas as deprecated when all variants or referenced schemas are deprecated
 */
export function normalizeSchema(schema: JSONSchema, options: NormalizeOptions = {}): JSONSchema {
    let normalized: JSONSchema = normalizeEnumToConst({...schema});

    // Normalize conditionals first (before combinators)
    normalized = normalizeConditional(normalized);
    normalized = normalizeCombinators(normalized, options);
    normalized = normalizeNestedSchemas(normalized, options);

    // Softly infer `type: 'object'` for schemas that clearly behave like objects
    // but do not declare the type explicitly (common in some OpenAPI specs).
    if (
        normalized.type === undefined &&
        (normalized.properties || normalized.additionalProperties || normalized.patternProperties)
    ) {
        normalized = {
            ...normalized,
            type: 'object',
        };
    }

    // Softly infer `type: 'array'` for schemas that define `items` but do not
    // declare the type explicitly.
    if (normalized.type === undefined && normalized.items !== undefined) {
        normalized = {
            ...normalized,
            type: 'array',
        };
    }

    if (!normalized.deprecated && allCombinatorVariantsDeprecated(normalized)) {
        normalized = {
            ...normalized,
            deprecated: true,
        };
    }

    normalized = markDeprecatedFromRefs(normalized, options.resolveRef);

    return normalized;
}
