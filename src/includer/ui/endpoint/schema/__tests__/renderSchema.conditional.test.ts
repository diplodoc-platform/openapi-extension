import type {JSONSchema} from '../index';

import {describe, expect, it} from 'vitest';
import dedent from 'ts-dedent';

import {renderSchema} from '../index';

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
          {% cut "**Type**: object" %}

          #|
          || **Name** | **Description** ||
          ||

          _zipCode_{.json-schema-reset .json-schema-property}
          {.table-cell}|
          **Type**: string

          _Pattern:_{.json-schema-reset .json-schema-assertion} \`^[0-9]{5}$\`
          {.table-cell}
          ||
          |#{.json-schema-properties}

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

          {% cut "**One of 2 types**" %}{.json-schema-combinators data-marker=or}

          - **Type**: object

            #|
            ||

            _zipCode_{.json-schema-reset .json-schema-property}
            {.table-cell}|
            **Type**: string

            _Pattern:_{.json-schema-reset .json-schema-assertion} \`^[0-9]{5}$\`
            {.table-cell}
            ||
            |#{.json-schema-properties}

          - **Type**: object

            #|
            ||

            _postalCode_{.json-schema-reset .json-schema-property}
            {.table-cell}|
            **Type**: string
            {.table-cell}
            ||
            |#{.json-schema-properties}

          {% endcut %}
        `);
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

        expect(content).toContain('**Type**: US Address Format');
        expect(content).toContain('**Type**: International Address Format');
    });
});
