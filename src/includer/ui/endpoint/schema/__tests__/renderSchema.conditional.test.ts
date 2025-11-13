import type {JSONSchema} from '../renderSchema';

import {describe, expect, it} from 'vitest';
import dedent from 'ts-dedent';

import {renderSchema} from '../renderSchema';

describe('renderSchema - conditional (if/then/else)', () => {
    it('renders if/then as conditional oneOf', () => {
        const schema: JSONSchema = {
            type: 'object',
            if: {
                properties: {
                    country: {const: 'USA'},
                },
            },
            then: {
                properties: {
                    zipCode: {
                        type: 'string',
                        pattern: '^[0-9]{5}$',
                    },
                },
            },
        };

        const content = renderSchema(schema, {suppressExamples: true});

        expect(content).toBe(dedent`
      **Type**: object

      {% cut "**Conditional**: country = "USA"" %}

      - **When country = "USA"**

        #| {.json-schema-properties}
        ||

        _zipCode_{.json-schema-reset .json-schema-property}
        {.table-cell}|
        **Type**: string

        _Pattern:_{.json-schema-reset .json-schema-assertion} \`^[0-9]{5}$\`
        {.table-cell}
        ||
        |#

      {% endcut %}
    `);
    });

    it('renders if/then/else as conditional oneOf with two variants', () => {
        const schema: JSONSchema = {
            type: 'object',
            if: {
                properties: {
                    country: {const: 'USA'},
                },
            },
            then: {
                properties: {
                    zipCode: {type: 'string', pattern: '^[0-9]{5}$'},
                },
            },
            else: {
                properties: {
                    postalCode: {type: 'string'},
                },
            },
        };

        const content = renderSchema(schema, {suppressExamples: true});

        expect(content).toBe(dedent`
      **Type**: object

      {% cut "**Conditional**: country = "USA"" %}

      - **When country = "USA"**

        #| {.json-schema-properties}
        ||

        _zipCode_{.json-schema-reset .json-schema-property}
        {.table-cell}|
        **Type**: string

        _Pattern:_{.json-schema-reset .json-schema-assertion} \`^[0-9]{5}$\`
        {.table-cell}
        ||
        |#

      - **When NOT country = "USA"**

        #| {.json-schema-properties}
        ||

        _postalCode_{.json-schema-reset .json-schema-property}
        {.table-cell}|
        **Type**: string
        {.table-cell}
        ||
        |#

      {% endcut %}
    `);
    });

    it('handles enum conditions', () => {
        const schema: JSONSchema = {
            type: 'object',
            if: {
                properties: {
                    status: {enum: ['active', 'pending']},
                },
            },
            then: {
                properties: {
                    approvedBy: {type: 'string'},
                },
            },
        };

        const content = renderSchema(schema, {suppressExamples: true});

        expect(content).toContain('**Conditional**: status in ["active", "pending"]');
    });

    it('handles required conditions', () => {
        const schema: JSONSchema = {
            type: 'object',
            if: {
                required: ['email', 'phone'],
            },
            then: {
                properties: {
                    contactMethod: {type: 'string'},
                },
            },
        };

        const content = renderSchema(schema, {suppressExamples: true});

        expect(content).toContain('**Conditional**: email, phone are required');
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
                    maxFeatures: {const: 100},
                },
            },
            oneOf: [
                {type: 'string', title: 'Text'},
                {type: 'number', title: 'Number'},
            ],
        };

        const content = renderSchema(schema, {suppressExamples: true});

        // Should have conditional variant + two existing variants
        expect(content).toContain('When premium = true');
        expect(content).toContain('**Text**');
        expect(content).toContain('**Number**');
    });

    it('handles type condition', () => {
        const schema: JSONSchema = {
            if: {
                type: 'string',
            },
            then: {
                minLength: 5,
            },
        };

        const content = renderSchema(schema, {suppressExamples: true});

        expect(content).toContain('**Conditional**: type is string');
    });

    it('uses custom titles if provided', () => {
        const schema: JSONSchema = {
            type: 'object',
            if: {
                properties: {
                    country: {const: 'USA'},
                },
            },
            then: {
                title: 'US Address Format',
                properties: {
                    zipCode: {type: 'string'},
                },
            },
            else: {
                title: 'International Address Format',
                properties: {
                    postalCode: {type: 'string'},
                },
            },
        };

        const content = renderSchema(schema, {suppressExamples: true});

        expect(content).toContain('**US Address Format**');
        expect(content).toContain('**International Address Format**');
    });
});
