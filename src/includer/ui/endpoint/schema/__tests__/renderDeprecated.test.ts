import type {JSONSchema, SchemaRenderer} from '../jsonSchema';

import {describe, expect, it} from 'vitest';

import {renderDeprecated} from '../renderDeprecated';
import {RenderContext} from '../jsonSchema';

const noopRenderSchema: SchemaRenderer = () => '';

function createContext(overrides: Partial<RenderContext> = {}): RenderContext {
    return new RenderContext({
        ref: () => undefined,
        renderSchema: noopRenderSchema,
        ...overrides,
    });
}

describe('renderDeprecated', () => {
    it('returns empty string when not deprecated', () => {
        const schema: JSONSchema = {type: 'string'};

        expect(renderDeprecated(schema, createContext())).toBe('');
    });

    it('renders deprecation warning when deprecated is true', () => {
        const schema: JSONSchema = {type: 'string', deprecated: true};

        expect(renderDeprecated(schema, createContext())).toBe(
            '> ⚠️ **Deprecated**: This field is deprecated and may be removed in future versions.',
        );
    });

    it('collects deprecated from ref chain', () => {
        const refs: Record<string, JSONSchema> = {
            '#/defs/Base': {
                deprecated: true,
            },
        };

        const schema: JSONSchema = {
            $ref: '#/defs/Base',
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

        expect(renderDeprecated(schema, context)).toBe(
            '> ⚠️ **Deprecated**: This field is deprecated and may be removed in future versions.',
        );
    });

    it('ignores deprecated:false', () => {
        const schema: JSONSchema = {type: 'string', deprecated: false};

        expect(renderDeprecated(schema, createContext())).toBe('');
    });
});
