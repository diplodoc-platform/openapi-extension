import type {JSONSchema, SchemaRenderer} from '../jsonSchema';

import {describe, expect, it} from 'vitest';

import {RenderContext} from '../jsonSchema';
import {renderAssertions} from '../renderAssertions';

const noopRenderSchema: SchemaRenderer = () => '';
const context = new RenderContext({
    ref: () => undefined,
    renderSchema: noopRenderSchema,
});

describe('renderAssertions', () => {
    it('returns empty string when schema has no assertions', () => {
        const schema: JSONSchema = {type: 'string'};

        expect(renderAssertions(schema, context)).toBe('');
    });

    it('renders assertions matching schema types', () => {
        const schema: JSONSchema = {
            type: ['number', 'string'],
            minimum: 5,
            maximum: 10,
            minLength: 2,
            maxLength: 8,
        };

        expect(renderAssertions(schema, context).split('\n\n')).toEqual([
            '_Min value:_{.json-schema-reset .json-schema-assertion} `5`',
            '_Max value:_{.json-schema-reset .json-schema-assertion} `10`',
            '_Min length:_{.json-schema-reset .json-schema-assertion} `2`',
            '_Max length:_{.json-schema-reset .json-schema-assertion} `8`',
        ]);
    });

    it('renders array-specific assertions only for arrays', () => {
        const schema: JSONSchema = {
            type: 'array',
            uniqueItems: true,
        };

        expect(renderAssertions(schema, context)).toBe(
            '_Unique items:_{.json-schema-reset .json-schema-assertion} `true`',
        );
    });

    it('omits unique items when value is false', () => {
        const schema: JSONSchema = {
            type: 'array',
            uniqueItems: false,
        };

        expect(renderAssertions(schema, context)).toBe('');
    });

    it('prefers explicit false over ref unique items', () => {
        const refs: Record<string, JSONSchema> = {
            '#/defs/ArrayRef': {
                type: 'array',
                uniqueItems: true,
            },
        };

        const schema: JSONSchema = {
            type: 'array',
            uniqueItems: false,
            $ref: '#/defs/ArrayRef',
        };

        const refContext = new RenderContext({
            ref: (refId) => {
                const resolved = refs[refId];
                if (!resolved) {
                    return undefined;
                }
                return {href: refId, schema: resolved};
            },
            renderSchema: noopRenderSchema,
        });

        expect(renderAssertions(schema, refContext)).toBe('');
    });

    it('skips array assertions for string schemas', () => {
        const schema: JSONSchema = {
            type: 'string',
            uniqueItems: true,
        };

        expect(renderAssertions(schema, context)).toBe('');
    });

    it('skips typed assertions if schema type is unknown', () => {
        const schema: JSONSchema = {
            minLength: 5,
        };

        expect(renderAssertions(schema, context)).toBe('');
    });

    it('collects assertions through ref chain without duplicates', () => {
        const refs: Record<string, JSONSchema> = {
            '#/defs/Child': {
                type: 'integer',
                maximum: 10,
                $ref: '#/defs/Grandchild',
            },
            '#/defs/Grandchild': {
                type: 'integer',
                minimum: 1,
            },
        };

        const schema: JSONSchema = {
            type: 'integer',
            exclusiveMinimum: 0,
            $ref: '#/defs/Child',
        };

        const refContext = new RenderContext({
            ref: (refId) => {
                const resolved = refs[refId];
                if (!resolved) {
                    return undefined;
                }
                return {href: refId, schema: resolved};
            },
            renderSchema: noopRenderSchema,
        });

        const result = renderAssertions(schema, refContext).split('\n\n');
        expect(result).toEqual([
            '_Min value:_{.json-schema-reset .json-schema-assertion} `1`',
            '_Max value:_{.json-schema-reset .json-schema-assertion} `10`',
            '_Exclusive min:_{.json-schema-reset .json-schema-assertion} `0`',
        ]);
    });

    it('handles nested assertions with overrides', () => {
        const refs: Record<string, JSONSchema> = {
            '#/defs/Level2': {
                type: 'array',
                maxItems: 5,
                $ref: '#/defs/Level3',
            },
            '#/defs/Level3': {
                type: 'array',
                minItems: 1,
                uniqueItems: true,
            },
        };

        const schema: JSONSchema = {
            type: 'array',
            minItems: 2,
            $ref: '#/defs/Level2',
        };

        const contextWithRefs = new RenderContext({
            ref: (refId) => {
                const resolved = refs[refId];
                if (!resolved) {
                    return undefined;
                }

                return {href: refId, schema: resolved};
            },
            renderSchema: noopRenderSchema,
        });

        const actualLines = renderAssertions(schema, contextWithRefs).split('\n\n');
        expect(actualLines).toEqual([
            '_Min items:_{.json-schema-reset .json-schema-assertion} `2`',
            '_Max items:_{.json-schema-reset .json-schema-assertion} `5`',
            '_Unique items:_{.json-schema-reset .json-schema-assertion} `true`',
        ]);
    });

    it('collects nested assertions for arrays with $ref items', () => {
        const refs: Record<string, JSONSchema> = {
            '#/defs/Item': {
                type: 'array',
                minItems: 2,
                items: {
                    $ref: '#/defs/Leaf',
                },
            },
            '#/defs/Leaf': {
                type: 'string',
                maxLength: 5,
            },
        };

        const schema: JSONSchema = {
            type: 'array',
            $ref: '#/defs/Item',
            uniqueItems: true,
        };

        const refContext = new RenderContext({
            ref: (refId) => {
                const resolved = refs[refId];
                if (!resolved) {
                    return undefined;
                }
                return {href: refId, schema: resolved};
            },
            renderSchema: noopRenderSchema,
        });

        expect(renderAssertions(schema, refContext).split('\n\n')).toEqual([
            '_Min items:_{.json-schema-reset .json-schema-assertion} `2`',
            '_Unique items:_{.json-schema-reset .json-schema-assertion} `true`',
        ]);
    });
});
