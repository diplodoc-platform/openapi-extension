import type {JSONSchema} from '../index';

import {describe, expect, it} from 'vitest';
import dedent from 'ts-dedent';

import {renderSchema} from '../index';

describe('renderSchema - title', () => {
    it('renders title before type for simple schemas', () => {
        const schema: JSONSchema = {
            title: 'User Name',
            type: 'string',
            description: 'Full name of the user',
        };

        const content = renderSchema(schema, {suppressExamples: true});

        expect(content).toBe(dedent`
          **User Name**

          **Type**: string

          Full name of the user
        `);
    });

    it('uses title in cut block for objects', () => {
        const schema: JSONSchema = {
            type: 'object',
            title: 'User Profile',
            properties: {
                name: {type: 'string'},
            },
        };

        const content = renderSchema(schema, {suppressExamples: true});

        expect(content).toBe(dedent`
          {% cut "**Type**: User Profile" %}

          #|
          || **Name** | **Description** ||
          ||

          _name_{.json-schema-reset .json-schema-property}
          {.table-cell}|
          **Type**: string
          {.table-cell}
          ||
          |#{.json-schema-properties}

          {% endcut %}
        `);
    });

    it('renders combinator title using variant titles', () => {
        const schema: JSONSchema = {
            oneOf: [
                {type: 'string', title: 'Text'},
                {type: 'number', title: 'Number'},
            ],
        };

        const content = renderSchema(schema, {suppressExamples: true});

        expect(content).toBe(dedent`
          {% cut "**One of**: Text **or** Number" %}{.json-schema-combinators data-marker=or}

          - **Text**

            **Type**: string

          - **Number**

            **Type**: number

          {% endcut %}
        `);
    });

    it('falls back to type count when not all variants have titles', () => {
        const schema: JSONSchema = {
            oneOf: [{type: 'string', title: 'Text'}, {type: 'number'}],
        };

        const content = renderSchema(schema, {suppressExamples: true});

        expect(content).toBe(dedent`
          {% cut "**One of 2 types**" %}{.json-schema-combinators data-marker=or}

          - **Text**

            **Type**: string

          - **Type**: number

          {% endcut %}
        `);
    });

    describe('with deprecated label', () => {
        it('returns empty string when not deprecated', () => {
            const schema: JSONSchema = {type: 'string'};

            expect(renderSchema(schema, {suppressExamples: true})).toBe(dedent`
                **Type**: string
            `);
        });

        it('renders deprecation warning when deprecated is true', () => {
            const schema: JSONSchema = {type: 'string', deprecated: true};

            expect(renderSchema(schema, {suppressExamples: true})).toBe(dedent`
                _Deprecated_{.json-schema-reset .json-schema-deprecated-title}{title="This entity is deprecated and may be removed in future versions."}

                **Type**: string
            `);
        });

        it('ignores deprecated:false', () => {
            const schema: JSONSchema = {type: 'string', deprecated: false};

            expect(renderSchema(schema, {suppressExamples: true})).toBe(dedent`
                **Type**: string
            `);
        });

        it('combines with title', () => {
            const schema: JSONSchema = {
                type: 'string',
                deprecated: true,
                title: 'Text',
            };

            expect(renderSchema(schema, {suppressExamples: true})).toBe(dedent`
                **Text**

                _Deprecated_{.json-schema-reset .json-schema-deprecated-title}{title="This entity is deprecated and may be removed in future versions."}

                **Type**: string
            `);
        });
    });
});
