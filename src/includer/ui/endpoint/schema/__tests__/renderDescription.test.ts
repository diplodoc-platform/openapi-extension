import type {JSONSchema, SchemaRenderer} from '../jsonSchema';

import {describe, expect, it} from 'vitest';

import {RenderContext} from '../jsonSchema';
import {renderDescription} from '../renderDescription';

const noopRenderSchema: SchemaRenderer = (schema) => JSON.stringify(schema);

function createContext(refs: Record<string, JSONSchema>) {
    return new RenderContext({
        ref: (refId) => {
            const schema = refs[refId];
            if (!schema) {
                return undefined;
            }

            return {href: refId, schema};
        },
        renderSchema: noopRenderSchema,
    });
}

describe('renderDescription', () => {
    it('returns only local description when no refs', () => {
        const schema: JSONSchema = {description: 'Root description'};
        const context = createContext({});

        expect(renderDescription(schema, context)).toBe('Root description');
    });

    it('collects descriptions through ref chain without duplicates', () => {
        const refs: Record<string, JSONSchema> = {
            '#/defs/Child': {
                description: 'Child description',
                $ref: '#/defs/Grandchild',
            },
            '#/defs/Grandchild': {
                description: 'Grandchild description',
            },
        };

        const schema: JSONSchema = {
            description: 'Root description',
            $ref: '#/defs/Child',
        };

        const context = createContext(refs);

        expect(renderDescription(schema, context)).toBe(
            ['Root description', 'Child description', 'Grandchild description'].join('\n\n'),
        );
    });

    it('ignores repeated descriptions and circular refs', () => {
        const refs: Record<string, JSONSchema> = {
            '#/defs/Loop1': {
                description: 'Repeating description',
                $ref: '#/defs/Loop2',
            },
            '#/defs/Loop2': {
                description: 'Repeating description',
                $ref: '#/defs/Loop1',
            },
        };

        const schema: JSONSchema = {
            description: 'Repeating description',
            $ref: '#/defs/Loop1',
        };

        const context = createContext(refs);

        expect(renderDescription(schema, context)).toBe('Repeating description');
    });
});
