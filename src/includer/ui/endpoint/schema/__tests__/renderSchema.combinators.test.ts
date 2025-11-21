import type {JSONSchema} from '../index';

import {describe, expect, it} from 'vitest';
import dedent from 'ts-dedent';

import {renderSchema} from '../index';

describe('renderSchema - combinators', () => {
    it('renders oneOf with nested variants', () => {
        const schema: JSONSchema = {
            oneOf: [
                {type: 'string', description: 'Строка'},
                {
                    type: 'object',
                    properties: {
                        value: {type: 'number', description: 'Число'},
                    },
                },
            ],
        };

        const content = renderSchema(schema, {suppressExamples: true});

        expect(content).toBe(dedent`
      {% cut "**One of 2 types**" %}{.json-schema-combinators data-marker=or}

      - **Type**: string

        Строка

      - **Type**: object

        #|
        ||

        _value_{.json-schema-reset .json-schema-property}
        {.table-cell}|
        **Type**: number

        Число
        {.table-cell}
        ||
        |#{.json-schema-properties}

      {% endcut %}
    `);
    });

    it('renders oneOf in addition to declared type', () => {
        const schema: JSONSchema = {
            type: 'object',
            properties: {
                value: {type: 'string'},
            },
            oneOf: [{type: 'string'}, {type: 'number'}],
        };

        const content = renderSchema(schema, {suppressExamples: true});

        expect(content).toBe(dedent`
      {% cut "**Type**: object" %}

      #|
      || **Name** | **Description** ||
      ||

      _value_{.json-schema-reset .json-schema-property}
      {.table-cell}|
      **Type**: string
      {.table-cell}
      ||
      |#{.json-schema-properties}

      {% endcut %}

      {% cut "**One of 2 types**" %}{.json-schema-combinators data-marker=or}

      - **Type**: string

      - **Type**: number

      {% endcut %}
    `);
    });

    it('renders nested oneOf when variant has its own metadata', () => {
        const schema: JSONSchema = {
            oneOf: [
                {
                    description: 'Комбинированное значение',
                    oneOf: [
                        {type: 'string', description: 'Строка'},
                        {type: 'number', description: 'Число'},
                    ],
                },
                {
                    type: 'boolean',
                    description: 'Булевый флаг',
                },
            ],
        };

        const content = renderSchema(schema, {suppressExamples: true});

        expect(content).toBe(dedent`
      {% cut "**One of 2 types**" %}{.json-schema-combinators data-marker=or}

      - {% cut "**One of 2 types**" %}{.json-schema-combinators data-marker=or}

        - **Type**: string

          Строка

        - **Type**: number

          Число

        {% endcut %}

        Комбинированное значение

      - **Type**: boolean

        Булевый флаг

      {% endcut %}
    `);
    });

    it('normalizes nested oneOf without extra metadata', () => {
        const schema: JSONSchema = {
            oneOf: [
                {
                    oneOf: [
                        {type: 'string', description: 'Строка'},
                        {type: 'number', description: 'Число'},
                    ],
                },
                {type: 'boolean', description: 'Булевый флаг'},
            ],
        };

        const content = renderSchema(schema, {suppressExamples: true});

        expect(content).toBe(dedent`
      {% cut "**One of 3 types**" %}{.json-schema-combinators data-marker=or}

      - **Type**: string

        Строка

      - **Type**: number

        Число

      - **Type**: boolean

        Булевый флаг

      {% endcut %}
    `);
    });

    it('normalizes single-element oneOf', () => {
        const schema: JSONSchema = {
            oneOf: [
                {
                    type: 'boolean',
                    description: 'Булевый флаг',
                },
            ],
        };

        const content = renderSchema(schema, {suppressExamples: true});

        expect(content).toBe(dedent`
      **Type**: boolean

      Булевый флаг
    `);
    });

    it('renders anyOf variants', () => {
        const schema: JSONSchema = {
            anyOf: [{type: 'string', description: 'Строка'}, {type: 'number'}],
        };

        const content = renderSchema(schema, {suppressExamples: true});

        expect(content).toBe(dedent`
      {% cut "**Any of 2 types**" %}{.json-schema-combinators data-marker=or}

      - **Type**: string

        Строка

      - **Type**: number

      {% endcut %}
    `);
    });

    it('renders allOf variants', () => {
        const schema: JSONSchema = {
            allOf: [
                {type: 'string', description: 'Строка'},
                {type: 'number', description: 'Число'},
            ],
        };

        const content = renderSchema(schema, {suppressExamples: true});

        expect(content).toBe(dedent`
      {% cut "**All of 2 types**" %}{.json-schema-combinators data-marker=and}

      - **Type**: string

        Строка

      - **Type**: number

        Число

      {% endcut %}
    `);
    });
});
