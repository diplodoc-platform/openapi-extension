import type {JSONSchema, SchemaRenderOptions} from '../jsonSchema';

import {describe, expect, it} from 'vitest';

import {renderTitle} from '../renderTitle';
import {RenderContext} from '../jsonSchema';

function createContext(overrides: SchemaRenderOptions = {}): RenderContext {
    return new RenderContext({
        renderSchema: () => '',
        ref: () => undefined,
        ...overrides,
    });
}

describe('renderTitle', () => {
    it('returns empty string when title is not provided', () => {
        const schema: JSONSchema = {type: 'string'};

        expect(renderTitle(schema, createContext())).toBe('');
    });

    it('renders title from schema', () => {
        const schema: JSONSchema = {title: 'User Profile'};

        expect(renderTitle(schema, createContext())).toBe('**User Profile**');
    });

    it('collects title from ref when not defined locally', () => {
        const refs: Record<string, JSONSchema> = {
            '#/defs/Base': {
                title: 'Base Schema',
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

        expect(renderTitle(schema, context)).toBe('**Base Schema**');
    });

    it('prefers local title over ref', () => {
        const refs: Record<string, JSONSchema> = {
            '#/defs/Base': {
                title: 'Base Schema',
            },
        };

        const schema: JSONSchema = {
            title: 'Extended Schema',
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

        expect(renderTitle(schema, context)).toBe('**Extended Schema**');
    });

    it('deduplicates titles from ref chain', () => {
        const refs: Record<string, JSONSchema> = {
            '#/defs/Child': {
                title: 'Common Title',
                $ref: '#/defs/Grandchild',
            },
            '#/defs/Grandchild': {
                title: 'Common Title',
            },
        };

        const schema: JSONSchema = {
            title: 'Common Title',
            $ref: '#/defs/Child',
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

        expect(renderTitle(schema, context)).toBe('**Common Title**');
    });
});
