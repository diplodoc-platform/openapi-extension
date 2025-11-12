import type {JSONSchema, RenderContextOptions, SchemaRenderer} from '../jsonSchema';

import {describe, expect, it} from 'vitest';

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

describe('renderExamples - pattern support', () => {
    it('generates example for US ZIP code pattern', () => {
        const schema: JSONSchema = {
            type: 'string',
            pattern: '^[0-9]{5}$',
        };

        const result = renderExamples(schema, createContext());

        expect(result).toBe(`_Example:_{.json-schema-reset .json-schema-example} \`12345\``);
    });

    it('generates example for extended ZIP code pattern', () => {
        const schema: JSONSchema = {
            type: 'string',
            pattern: '^[0-9]{5}(-[0-9]{4})?$',
        };

        const result = renderExamples(schema, createContext());

        expect(result).toBe(`_Example:_{.json-schema-reset .json-schema-example} \`12345-6789\``);
    });

    it('generates example for hex color pattern', () => {
        const schema: JSONSchema = {
            type: 'string',
            pattern: '^#[0-9a-fA-F]{6}$',
        };

        const result = renderExamples(schema, createContext());

        expect(result).toBe(`_Example:_{.json-schema-reset .json-schema-example} \`#FF5733\``);
    });

    it('generates example for date pattern', () => {
        const schema: JSONSchema = {
            type: 'string',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        };

        const result = renderExamples(schema, createContext());

        expect(result).toBe(`_Example:_{.json-schema-reset .json-schema-example} \`2025-01-15\``);
    });

    it('generates example for simple digit pattern with {N}', () => {
        const schema: JSONSchema = {
            type: 'string',
            pattern: '^[0-9]{3}$',
        };

        const result = renderExamples(schema, createContext());

        expect(result).toBe(`_Example:_{.json-schema-reset .json-schema-example} \`111\``);
    });

    it('generates example for lowercase letters pattern', () => {
        const schema: JSONSchema = {
            type: 'string',
            pattern: '^[a-z]{5}$',
        };

        const result = renderExamples(schema, createContext());

        expect(result).toBe(`_Example:_{.json-schema-reset .json-schema-example} \`aaaaa\``);
    });

    it('generates example for uppercase letters pattern', () => {
        const schema: JSONSchema = {
            type: 'string',
            pattern: '^[A-Z]{3}$',
        };

        const result = renderExamples(schema, createContext());

        expect(result).toBe(`_Example:_{.json-schema-reset .json-schema-example} \`AAA\``);
    });

    it('generates example for alphanumeric pattern', () => {
        const schema: JSONSchema = {
            type: 'string',
            pattern: '^[a-zA-Z0-9]{8}$',
        };

        const result = renderExamples(schema, createContext());

        expect(result).toBe(`_Example:_{.json-schema-reset .json-schema-example} \`abc123xx\``);
    });

    it('falls back to format when pattern is not recognized', () => {
        const schema: JSONSchema = {
            type: 'string',
            pattern: '^(?!.*bad).*$', // Complex pattern
            format: 'email',
        };

        const result = renderExamples(schema, createContext());

        // Should fall back to format-based example
        expect(result).toContain('user@example.com');
    });

    it('falls back to generic example when pattern and format are not recognized', () => {
        const schema: JSONSchema = {
            type: 'string',
            pattern: '^(?!.*bad).*$', // Complex pattern without known format
        };

        const result = renderExamples(schema, createContext());

        // Should fall back to 'example'
        expect(result).toContain('example');
    });

    it('prefers explicit example over pattern', () => {
        const schema: JSONSchema = {
            type: 'string',
            pattern: '^[0-9]{5}$',
            example: '99999',
        };

        const result = renderExamples(schema, createContext());

        expect(result).toBe(`_Example:_{.json-schema-reset .json-schema-example} \`99999\``);
    });

    it('respects minLength when pattern example is too short', () => {
        const schema: JSONSchema = {
            type: 'string',
            pattern: '^[0-9]{3}$',
            minLength: 5,
        };

        const result = renderExamples(schema, createContext());

        // Pattern generates '111', but minLength is 5, so should be padded
        expect(result).toContain('111aa');
    });
});
