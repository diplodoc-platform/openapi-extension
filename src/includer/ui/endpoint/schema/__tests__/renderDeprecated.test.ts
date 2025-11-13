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
            '_⚠️ Deprecated_{.json-schema-reset .json-schema-deprecated-title}_: This entity is deprecated and may be removed in future versions._{.json-schema-reset .json-schema-deprecated-message}',
        );
    });

    it('ignores deprecated:false', () => {
        const schema: JSONSchema = {type: 'string', deprecated: false};

        expect(renderDeprecated(schema, createContext())).toBe('');
    });
});
