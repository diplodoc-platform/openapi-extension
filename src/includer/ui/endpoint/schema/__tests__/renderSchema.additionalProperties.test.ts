import type {JSONSchema} from '../index';

import {describe, expect, it} from 'vitest';
import dedent from 'ts-dedent';

import {renderSchema} from '../index';

describe('renderSchema - additionalProperties', () => {
    it('renders additionalProperties: true by default', () => {
        const schema: JSONSchema = {
            type: 'object',
            additionalProperties: true,
        };

        const content = renderSchema(schema, {suppressExamples: true});

        expect(content).toBe(dedent`
          {% cut "**Type**: object" %}

          #|
          || **Name** | **Description** ||
          ||

          _[additional]_{.json-schema-reset .json-schema-additional-property}
          {.table-cell}|
          **Type**: any
          {.table-cell}
          ||
          |#{.json-schema-properties}

          {% endcut %}
        `);
    });

    it('renders additionalProperties: false by default', () => {
        const schema: JSONSchema = {
            type: 'object',
            additionalProperties: false,
        };

        const content = renderSchema(schema, {suppressExamples: true});

        expect(content).toBe(dedent`
      {% cut "**Type**: object" %}

      #|
      || **Name** | **Description** ||
      ||

      _[additional]_{.json-schema-reset .json-schema-additional-property}
      {.table-cell}|
      **Type**: never
      {.table-cell}
      ||
      |#{.json-schema-properties}

      {% endcut %}
    `);
    });

    it('suppresses additionalProperties: true when suppressVerboseAdditional is set', () => {
        const schema: JSONSchema = {
            type: 'object',
            additionalProperties: true,
        };

        const content = renderSchema(schema, {
            suppressExamples: true,
            suppressVerboseAdditional: true,
        });

        expect(content).toBe(dedent`
      {% cut "**Type**: object" %}

      #|
      || **Name** | **Description** ||
      |#{.json-schema-properties}

      {% endcut %}
    `);
    });

    it('suppresses additionalProperties: false when suppressVerboseAdditional is set', () => {
        const schema: JSONSchema = {
            type: 'object',
            additionalProperties: false,
        };

        const content = renderSchema(schema, {
            suppressExamples: true,
            suppressVerboseAdditional: true,
        });

        expect(content).toBe(dedent`
      {% cut "**Type**: object" %}

      #|
      || **Name** | **Description** ||
      |#{.json-schema-properties}

      {% endcut %}
    `);
    });

    it('always renders additionalProperties with schema even when suppressVerboseAdditional is set', () => {
        const schema: JSONSchema = {
            type: 'object',
            additionalProperties: {
                type: 'string',
                description: 'Any string value',
            },
        };

        const content = renderSchema(schema, {
            suppressExamples: true,
            suppressVerboseAdditional: true,
        });

        expect(content).toBe(dedent`
      {% cut "**Type**: object" %}

      #|
      || **Name** | **Description** ||
      ||

      _[additional]_{.json-schema-reset .json-schema-additional-property}
      {.table-cell}|
      **Type**: string

      Any string value
      {.table-cell}
      ||
      |#{.json-schema-properties}

      {% endcut %}
    `);
    });

    it('renders object with properties and additionalProperties: true', () => {
        const schema: JSONSchema = {
            type: 'object',
            properties: {
                name: {type: 'string'},
            },
            additionalProperties: true,
        };

        const content = renderSchema(schema, {suppressExamples: true});

        expect(content).toBe(dedent`
      {% cut "**Type**: object" %}

      #|
      || **Name** | **Description** ||
      ||

      _name_{.json-schema-reset .json-schema-property}
      {.table-cell}|
      **Type**: string
      {.table-cell}
      ||
      ||

      _[additional]_{.json-schema-reset .json-schema-additional-property}
      {.table-cell}|
      **Type**: any
      {.table-cell}
      ||
      |#{.json-schema-properties}

      {% endcut %}
    `);
    });

    it('suppresses verbose additional in object with properties when suppressVerboseAdditional is set', () => {
        const schema: JSONSchema = {
            type: 'object',
            properties: {
                name: {type: 'string'},
            },
            additionalProperties: true,
        };

        const content = renderSchema(schema, {
            suppressExamples: true,
            suppressVerboseAdditional: true,
        });

        expect(content).toBe(dedent`
      {% cut "**Type**: object" %}

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
});
