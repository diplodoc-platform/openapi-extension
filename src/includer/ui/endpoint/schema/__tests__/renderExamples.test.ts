import type {JSONSchema, RenderContextOptions, SchemaRenderer} from '../jsonSchema';

import {describe, expect, it} from 'vitest';
import dedent from 'ts-dedent';

import {RenderContext} from '../jsonSchema';
import {renderExamples} from '../renderExamples';

const noopRenderSchema: SchemaRenderer = () => '';

function createContext(overrides: Partial<RenderContextOptions> = {}) {
    return new RenderContext({
        ref: () => undefined,
        renderSchema: noopRenderSchema,
        ...overrides,
    });
}

describe('renderExamples', () => {
    it('renders explicit example value', () => {
        const schema: JSONSchema = {example: 'demo'};

        expect(renderExamples(schema, createContext())).toBe(
            `_Example:_{.json-schema-reset .json-schema-example} \`demo\``,
        );
    });

    it('deduplicates examples from array and example property', () => {
        const schema: JSONSchema = {
            example: 'foo',
            examples: ['foo', 'bar'],
        };

        expect(renderExamples(schema, createContext())).toBe(dedent`
          {% cut "**Examples**" %}{.json-schema-example}

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
          {% cut "**Example**" %}{.json-schema-example}

          \`\`\`json translate=no
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
          {% cut "**Example**" %}{.json-schema-example}

          \`\`\`json translate=no
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
          {% cut "**Example**" %}{.json-schema-example}

          \`\`\`json translate=no
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
          {% cut "**Example**" %}{.json-schema-example}

          \`\`\`json translate=no
          {
            "quantity": 1
          }
          \`\`\`

          {% endcut %}
        `);
    });

    it('coerces property example to match string type when building object example', () => {
        const schema: JSONSchema = {
            type: 'object',
            properties: {
                field: {
                    type: 'string',
                    // YAML parser could parse `example: 10` as number
                    // but resulting object example should still contain a string.
                    example: 10 as unknown as string,
                },
            },
        };

        expect(renderExamples(schema, createContext())).toBe(dedent`
          {% cut "**Example**" %}{.json-schema-example}

          \`\`\`json translate=no
          {
            "field": "10"
          }
          \`\`\`

          {% endcut %}
        `);
    });

    it('skips examples for boolean schemas', () => {
        const schema: JSONSchema = {type: 'boolean'};

        expect(renderExamples(schema, createContext())).toBe('');
    });

    it('skips examples for number schemas', () => {
        const schema: JSONSchema = {type: 'number'};

        expect(renderExamples(schema, createContext())).toBe('');
    });

    it('skips examples for integer schemas', () => {
        const schema: JSONSchema = {type: 'integer'};

        expect(renderExamples(schema, createContext())).toBe('');
    });

    it('skips examples for defaults', () => {
        const schema: JSONSchema = {
            type: 'string',
            default: 'test',
        };

        expect(renderExamples(schema, createContext())).toBe('');
    });

    it('skips examples for string enums', () => {
        const schema: JSONSchema = {
            type: 'string',
            enum: ['alpha', 'beta'],
        };

        expect(renderExamples(schema, createContext())).toBe('');
    });

    it('uses default when generating example for object', () => {
        const schema: JSONSchema = {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    default: 'John',
                },
                age: {
                    type: 'integer',
                    default: 42,
                },
            },
        };

        expect(renderExamples(schema, createContext())).toBe(dedent`
          {% cut "**Example**" %}{.json-schema-example}

          \`\`\`json translate=no
          {
            "name": "John",
            "age": 42
          }
          \`\`\`

          {% endcut %}
        `);
    });

    it('uses const when generating example for object', () => {
        const schema: JSONSchema = {
            type: 'object',
            properties: {
                status: {
                    type: 'string',
                    const: 'fixed',
                },
            },
        };

        expect(renderExamples(schema, createContext())).toBe(dedent`
          {% cut "**Example**" %}{.json-schema-example}

          \`\`\`json translate=no
          {
            "status": "fixed"
          }
          \`\`\`

          {% endcut %}
        `);
    });
});
