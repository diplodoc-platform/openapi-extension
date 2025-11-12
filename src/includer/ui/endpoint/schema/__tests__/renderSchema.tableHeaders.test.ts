import type {JSONSchema} from '../index';

import {describe, expect, it} from 'vitest';
import dedent from 'ts-dedent';

import {renderSchema} from '../index';

describe('renderSchema - table headers', () => {
    it('renders table with headers by default', () => {
        const schema: JSONSchema = {
            type: 'object',
            properties: {
                name: {type: 'string'},
                age: {type: 'number'},
            },
        };

        const content = renderSchema(schema, {suppressExamples: true});

        expect(content).toBe(dedent`
      {% cut "**Type**: object" %}

      #|
      || **Name** | **Description** ||
      ||

      _age_{.json-schema-reset .json-schema-property}
      {.table-cell}|
      **Type**: number
      {.table-cell}
      ||
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

    it('renders table without headers when suppressTableHeaders is true', () => {
        const schema: JSONSchema = {
            type: 'object',
            properties: {
                name: {type: 'string'},
                age: {type: 'number'},
            },
        };

        const content = renderSchema(schema, {
            suppressExamples: true,
            suppressTableHeaders: true,
        });

        expect(content).toBe(dedent`
      {% cut "**Type**: object" %}

      #|
      ||

      _age_{.json-schema-reset .json-schema-property}
      {.table-cell}|
      **Type**: number
      {.table-cell}
      ||
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

    it('suppresses headers in nested objects', () => {
        const schema: JSONSchema = {
            type: 'object',
            properties: {
                user: {
                    type: 'object',
                    properties: {
                        name: {type: 'string'},
                        email: {type: 'string'},
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

      _user_{.json-schema-reset .json-schema-property}
      {.table-cell}|
      {% cut "**Type**: object" %}

      #|
      ||

      _email_{.json-schema-reset .json-schema-property}
      {.table-cell}|
      **Type**: string
      {.table-cell}
      ||
      ||

      _name_{.json-schema-reset .json-schema-property}
      {.table-cell}|
      **Type**: string
      {.table-cell}
      ||
      |#{.json-schema-properties}

      {% endcut %}
      {.table-cell}
      ||
      |#{.json-schema-properties}

      {% endcut %}
    `);
    });

    it('suppresses headers in deeply nested objects', () => {
        const schema: JSONSchema = {
            type: 'object',
            properties: {
                level1: {
                    type: 'object',
                    properties: {
                        level2: {
                            type: 'object',
                            properties: {
                                value: {type: 'string'},
                            },
                        },
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

      _level1_{.json-schema-reset .json-schema-property}
      {.table-cell}|
      {% cut "**Type**: object" %}

      #|
      ||

      _level2_{.json-schema-reset .json-schema-property}
      {.table-cell}|
      {% cut "**Type**: object" %}

      #|
      ||

      _value_{.json-schema-reset .json-schema-property}
      {.table-cell}|
      **Type**: string
      {.table-cell}
      ||
      |#{.json-schema-properties}

      {% endcut %}
      {.table-cell}
      ||
      |#{.json-schema-properties}

      {% endcut %}
      {.table-cell}
      ||
      |#{.json-schema-properties}

      {% endcut %}
    `);
    });

    it('suppresses headers in additionalProperties', () => {
        const schema: JSONSchema = {
            type: 'object',
            additionalProperties: {
                type: 'object',
                properties: {
                    key: {type: 'string'},
                },
            },
        };

        const content = renderSchema(schema, {suppressExamples: true});

        expect(content).toBe(dedent`
            {% cut "**Type**: object" %}

            #|
            || **Name** | **Description** ||
            ||

            _[additional]_{.json-schema-reset .json-schema-additional-property}
            {.table-cell}|
            {% cut "**Type**: object" %}

            #|
            ||

            _key_{.json-schema-reset .json-schema-property}
            {.table-cell}|
            **Type**: string
            {.table-cell}
            ||
            |#{.json-schema-properties}

            {% endcut %}
            {.table-cell}
            ||
            |#{.json-schema-properties}

            {% endcut %}
        `);
    });
});
