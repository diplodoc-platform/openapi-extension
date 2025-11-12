import type {JSONSchema, SchemaRenderer} from '../jsonSchema';

import {describe, expect, it} from 'vitest';
import dedent from 'ts-dedent';

import {RenderContext} from '../jsonSchema';
import {renderValues} from '../renderValues';

const noopRenderSchema: SchemaRenderer = () => '';
const context = new RenderContext({
    ref: () => undefined,
    renderSchema: noopRenderSchema,
});

describe('renderValues', () => {
    it('returns empty string when values are not provided', () => {
        const schema: JSONSchema = {type: 'string'};

        expect(renderValues(schema, context)).toBe('');
    });

    it('renders default value', () => {
        const schema: JSONSchema = {default: 'guest'};

        expect(renderValues(schema, context)).toBe('**Default**: `guest`');
    });

    it('renders const value', () => {
        const schema: JSONSchema = {const: 42};

        expect(renderValues(schema, context)).toBe('**Const**: `42`');
    });

    it('renders enum values as list', () => {
        const schema: JSONSchema = {enum: ['a', 'b', null]};

        expect(renderValues(schema, context)).toBe('**Enum**: `a`, `b`, `null`');
    });

    it('renders combined values block', () => {
        const schema: JSONSchema = {
            default: 'admin',
            const: 'admin',
            enum: ['admin', 'guest'],
        };

        expect(renderValues(schema, context)).toBe(dedent`
      **Default**: \`admin\`

      **Const**: \`admin\`

      **Enum**: \`admin\`, \`guest\`
    `);
    });

    it('resolves values from ref when not defined locally', () => {
        const refs: Record<string, JSONSchema> = {
            '#/defs/Base': {
                default: 5,
                enum: [5, 10],
            },
        };

        const schema: JSONSchema = {
            $ref: '#/defs/Base',
        };

        const refContext = new RenderContext({
            ref: (refId) => {
                const resolved = refs[refId];
                if (!resolved) {
                    return undefined;
                }
                return {href: refId, schema: resolved};
            },
            renderSchema: noopRenderSchema,
        });

        expect(renderValues(schema, refContext)).toBe(dedent`
      **Default**: \`5\`

      **Enum**: \`5\`, \`10\`
    `);
    });

    it('prefers local values over ref', () => {
        const refs: Record<string, JSONSchema> = {
            '#/defs/Base': {
                default: 'guest',
                const: 'guest',
                enum: ['guest', 'viewer'],
            },
        };

        const schema: JSONSchema = {
            default: 'admin',
            $ref: '#/defs/Base',
        };

        const refContext = new RenderContext({
            ref: (refId) => {
                const resolved = refs[refId];
                if (!resolved) {
                    return undefined;
                }
                return {href: refId, schema: resolved};
            },
            renderSchema: noopRenderSchema,
        });

        expect(renderValues(schema, refContext)).toBe(dedent`
      **Default**: \`admin\`

      **Const**: \`guest\`

      **Enum**: \`guest\`, \`viewer\`
    `);
    });
});
