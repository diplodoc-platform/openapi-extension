import type {JSONSchema, SchemaRenderContext, SchemaRenderer} from '../jsonSchema';

import {describe, expect, it} from 'vitest';
import dedent from 'ts-dedent';

import {RenderContext} from '../jsonSchema';
import {renderExamples} from '../renderExamples';

const noopRenderSchema: SchemaRenderer = () => '';

function createContext(overrides: Partial<SchemaRenderContext> = {}) {
    return new RenderContext({
        ref: () => undefined,
        renderSchema: noopRenderSchema,
        ...overrides,
    });
}

describe('renderExamples', () => {
    it('renders explicit example value', () => {
        const schema: JSONSchema = {example: 'demo'};

        expect(renderExamples(schema, createContext())).toBe(dedent`
      {% cut "**Examples**" %}

      \`demo\`

      {% endcut %}
    `);
    });

    it('deduplicates examples from array and example property', () => {
        const schema: JSONSchema = {
            example: 'foo',
            examples: ['foo', 'bar'],
        };

        expect(renderExamples(schema, createContext())).toBe(dedent`
      {% cut "**Examples**" %}

      \`foo\`

      \`bar\`

      {% endcut %}
    `);
    });

    it('collects examples from referenced schemas', () => {
        const refs: Record<string, JSONSchema> = {
            '#/defs/User': {
                examples: [{id: 1}],
            },
        };

        const schema: JSONSchema = {
            $ref: '#/defs/User',
        };

        const context = createContext({
            ref: (refId) => {
                const resolved = refs[refId];
                if (!resolved) {
                    return undefined;
                }
                return {href: refId, schema: resolved};
            },
        });

        expect(renderExamples(schema, context)).toBe(dedent`
      {% cut "**Examples**" %}

      \`\`\`json
      {
        "id": 1
      }
      \`\`\`

      {% endcut %}
    `);
    });

    it('generates example when none provided', () => {
        const schema: JSONSchema = {
            type: 'object',
            properties: {
                name: {type: 'string'},
                age: {type: 'integer', minimum: 18},
            },
            required: ['name'],
        };

        expect(renderExamples(schema, createContext())).toBe(dedent`
      {% cut "**Examples**" %}

      \`\`\`json
      {
        "name": "example",
        "age": 18
      }
      \`\`\`

      {% endcut %}
    `);
    });

    it('respects writeOnly/readOnly visibility when generating examples', () => {
        const schema: JSONSchema = {
            type: 'object',
            properties: {
                publicField: {type: 'string'},
                secretField: {type: 'string', readOnly: true},
            },
        };

        const context = createContext({writeOnly: true});

        expect(renderExamples(schema, context)).toBe(dedent`
      {% cut "**Examples**" %}

      \`\`\`json
      {
        "publicField": "example"
      }
      \`\`\`

      {% endcut %}
    `);
    });

    it('generates example for object with integer minimum constraint', () => {
        const schema: JSONSchema = {
            type: 'object',
            properties: {
                quantity: {
                    description: 'Quantity of items.',
                    type: 'integer',
                    minimum: 1,
                },
            },
        };

        expect(renderExamples(schema, createContext())).toBe(dedent`
      {% cut "**Examples**" %}

      \`\`\`json
      {
        "quantity": 1
      }
      \`\`\`

      {% endcut %}
    `);
    });
});
