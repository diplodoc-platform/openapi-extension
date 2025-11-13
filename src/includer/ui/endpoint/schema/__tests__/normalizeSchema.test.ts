import type {JSONSchema} from '../jsonSchema';

import {describe, expect, it} from 'vitest';

import {normalizeSchema} from '../normalizeSchema';

describe('normalizeSchema', () => {
    it('returns schema unchanged when no oneOf is present', () => {
        const schema: JSONSchema = {
            type: 'string',
            description: 'Строка',
        };

        expect(normalizeSchema(schema)).toEqual(schema);
    });

    it('flattens nested oneOf without metadata', () => {
        const schema: JSONSchema = {
            oneOf: [
                {
                    oneOf: [{type: 'string'}, {type: 'number'}],
                },
                {type: 'boolean'},
            ],
        };

        expect(normalizeSchema(schema)).toEqual({
            oneOf: [{type: 'string'}, {type: 'number'}, {type: 'boolean'}],
        });
    });

    it('preserves nested oneOf when variant has additional metadata', () => {
        const schema: JSONSchema = {
            oneOf: [
                {
                    description: 'Комбинированное значение',
                    oneOf: [{type: 'string'}, {type: 'number'}],
                },
                {type: 'boolean'},
            ],
        };

        expect(normalizeSchema(schema)).toEqual({
            oneOf: [
                {
                    description: 'Комбинированное значение',
                    oneOf: [{type: 'string'}, {type: 'number'}],
                },
                {type: 'boolean'},
            ],
        });
    });

    it('replaces single-element oneOf with the variant schema', () => {
        const schema: JSONSchema = {
            oneOf: [
                {
                    type: 'boolean',
                    description: 'Булевый флаг',
                },
            ],
        };

        expect(normalizeSchema(schema)).toEqual({
            type: 'boolean',
            description: 'Булевый флаг',
        });
    });

    it('flattens nested allOf without metadata', () => {
        const schema: JSONSchema = {
            allOf: [
                {
                    allOf: [{type: 'string'}, {type: 'number'}],
                },
                {type: 'boolean'},
            ],
        };

        expect(normalizeSchema(schema)).toEqual({
            allOf: [{type: 'string'}, {type: 'number'}, {type: 'boolean'}],
        });
    });

    it('replaces single-element anyOf with the variant schema when plain', () => {
        const schema: JSONSchema = {
            anyOf: [{type: 'integer', description: 'Целое число'}],
        };

        expect(normalizeSchema(schema)).toEqual({
            type: 'integer',
            description: 'Целое число',
        });
    });

    it('keeps combinators when schema has additional metadata', () => {
        const schema: JSONSchema = {
            description: 'Комбинация условий',
            oneOf: [{type: 'string'}],
            allOf: [{type: 'number'}],
        };

        expect(normalizeSchema(schema)).toEqual({
            description: 'Комбинация условий',
            oneOf: [{type: 'string'}],
            allOf: [{type: 'number'}],
        });
    });

    it('converts if/then to plain', () => {
        const schema: JSONSchema = {
            if: {
                properties: {
                    premium: {const: true},
                },
            },
            then: {
                properties: {
                    maxFeatures: {const: 100},
                },
            },
        };

        const normalized = normalizeSchema(schema);

        expect(normalized.oneOf).not.toBeDefined();
        expect(normalized.properties).toBeDefined();
        expect(normalized.properties?.maxFeatures).toEqual({const: 100});
    });

    it('converts if/then/type to plain', () => {
        const schema: JSONSchema = {
            if: {
                properties: {
                    premium: {const: true},
                },
            },
            then: {
                properties: {
                    maxFeatures: {const: 100},
                },
            },
        };

        const normalized = normalizeSchema(schema);

        expect(normalized.oneOf).not.toBeDefined();
        expect(normalized.properties).toBeDefined();
        expect(normalized.properties?.maxFeatures).toEqual({const: 100});
    });

    it('converts if/then/type/properties to oneOf', () => {
        const schema: JSONSchema = {
            type: 'object',
            properties: {},
            if: {
                properties: {
                    premium: {const: true},
                },
            },
            then: {
                properties: {
                    maxFeatures: {const: 100},
                },
            },
        };

        const normalized = normalizeSchema(schema);

        expect(normalized.oneOf).toBeDefined();
        expect(normalized.oneOf?.length).toBe(1);
        expect(normalized.oneOf?.[0].properties?.maxFeatures).toEqual({const: 100});
    });

    it('converts if/then/else to oneOf with two variants', () => {
        const schema: JSONSchema = {
            if: {
                properties: {
                    country: {const: 'USA'},
                },
            },
            then: {
                properties: {
                    zipCode: {type: 'string'},
                },
            },
            else: {
                properties: {
                    postalCode: {type: 'string'},
                },
            },
        };

        const normalized = normalizeSchema(schema);

        expect(normalized.oneOf).toBeDefined();
        expect(normalized.oneOf?.length).toBe(2);
    });

    it('merges conditional with existing oneOf', () => {
        const schema: JSONSchema = {
            if: {
                properties: {
                    premium: {const: true},
                },
            },
            then: {
                properties: {
                    features: {minItems: 10},
                },
            },
            oneOf: [{type: 'string'}, {type: 'number'}],
        };

        const normalized = normalizeSchema(schema);

        expect(normalized.oneOf).toBeDefined();
        expect(normalized.oneOf?.length).toBe(3);
        expect(normalized.oneOf?.[1]).toEqual({type: 'string'});
        expect(normalized.oneOf?.[2]).toEqual({type: 'number'});
    });

    it('converts single-value enum to const', () => {
        const schema: JSONSchema = {
            type: 'string',
            enum: ['foo'],
        };

        expect(normalizeSchema(schema)).toEqual({
            type: 'string',
            const: 'foo',
        });
    });

    it('converts nested single-value enum to const', () => {
        const schema: JSONSchema = {
            type: 'object',
            properties: {
                status: {
                    type: 'string',
                    enum: ['active'],
                },
            },
        };

        expect(normalizeSchema(schema)).toEqual({
            type: 'object',
            properties: {
                status: {
                    type: 'string',
                    const: 'active',
                },
            },
        });
    });

    it('marks schema as deprecated when all combinator variants are deprecated', () => {
        const schema: JSONSchema = {
            oneOf: [
                {type: 'string', deprecated: true},
                {type: 'number', deprecated: true},
            ],
        };

        const normalized = normalizeSchema(schema);

        expect(normalized.deprecated).toBe(true);
        expect(normalized.oneOf).toEqual([
            {type: 'string', deprecated: true},
            {type: 'number', deprecated: true},
        ]);
    });

    it('does not mark schema as deprecated when some variants are not deprecated', () => {
        const schema: JSONSchema = {
            anyOf: [{type: 'boolean', deprecated: true}, {type: 'number'}],
        };

        const normalized = normalizeSchema(schema);

        expect(normalized.deprecated).toBeUndefined();
    });
});
