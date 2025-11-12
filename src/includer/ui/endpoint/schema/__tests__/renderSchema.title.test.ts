import type {JSONSchema} from '../renderSchema';

import {describe, expect, it} from 'vitest';
import dedent from 'ts-dedent';

import {renderSchema} from '../renderSchema';

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

      #| {.json-schema-properties}
      || Name | Description ||
      ||
      _name_{.json-schema-reset .json-schema-property}
      |
      **Type**: string
      ||
      |#

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
      {% cut "**One of**: Text or Number" %}

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
      {% cut "**One of 2 types**" %}

      - **Text**

        **Type**: string

      - **Type**: number

      {% endcut %}
    `);
    });
});
