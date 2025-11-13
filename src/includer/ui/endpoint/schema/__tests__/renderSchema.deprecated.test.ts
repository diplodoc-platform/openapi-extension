import type {JSONSchema} from '../renderSchema';

import {describe, expect, it} from 'vitest';
import dedent from 'ts-dedent';

import {renderSchema} from '../renderSchema';

describe('renderSchema - deprecated', () => {
    it('renders deprecation warning for top-level schema', () => {
        const schema: JSONSchema = {
            type: 'string',
            title: 'Old Field',
            deprecated: true,
            description: 'This field should not be used',
        };

        const content = renderSchema(schema, {suppressExamples: true});

        expect(content).toBe(dedent`
      **Old Field**

      > ⚠️ **Deprecated**: This field is deprecated and may be removed in future versions.

      **Type**: string

      This field should not be used
    `);
    });

    it('decorates deprecated properties in object table', () => {
        const schema: JSONSchema = {
            type: 'object',
            properties: {
                currentField: {type: 'string'},
                oldField: {type: 'string', deprecated: true},
            },
        };

        const content = renderSchema(schema, {suppressExamples: true});

        expect(content).toBe(dedent`
      {% cut "**Type**: object" %}

      #| {.json-schema-properties}
      || **Name** | **Description** ||
      ||

      _currentField_{.json-schema-reset .json-schema-property}
      {.table-cell}|
      **Type**: string
      {.table-cell}
      ||
      ||

      _oldField_{.json-schema-reset .json-schema-property .json-schema-deprecated}
      {.table-cell}|
      **Type**: string
      {.table-cell}
      ||
      |#

      {% endcut %}
    `);
    });

    it('renders deprecated warning for deprecated variants', () => {
        const schema: JSONSchema = {
            oneOf: [
                {type: 'string', title: 'Text', deprecated: true},
                {type: 'number', title: 'Number'},
            ],
        };

        const content = renderSchema(schema, {suppressExamples: true});

        expect(content).toBe(dedent`
      {% cut "**One of**: Text or Number" %}

      - **Text**

        > ⚠️ **Deprecated**: This field is deprecated and may be removed in future versions.

        **Type**: string

      - **Number**

        **Type**: number

      {% endcut %}
    `);
    });

    it('combines required and deprecated decorations', () => {
        const schema: JSONSchema = {
            type: 'object',
            properties: {
                legacyId: {type: 'string', deprecated: true},
            },
            required: ['legacyId'],
        };

        const content = renderSchema(schema, {suppressExamples: true});

        expect(content).toBe(dedent`
      {% cut "**Type**: object" %}

      #| {.json-schema-properties}
      || **Name** | **Description** ||
      ||

      _legacyId_{.json-schema-reset .json-schema-property .json-schema-required .json-schema-deprecated}
      {.table-cell}|
      **Type**: string
      {.table-cell}
      ||
      |#

      {% endcut %}
    `);
    });
});
