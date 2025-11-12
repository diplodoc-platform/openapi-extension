import type {JSONSchema} from '../index';

import {describe, expect, it} from 'vitest';
import dedent from 'ts-dedent';

import {renderSchema} from '../index';

describe('renderSchema - blocks configuration', () => {
    it('renders only specified blocks in custom order', () => {
        const schema: JSONSchema = {
            type: 'string',
            title: 'User Name',
            description: 'Name of the user',
            default: 'guest',
            minimum: 0,
            example: 'john_doe',
        };

        const content = renderSchema(schema, {
            blocks: ['title', 'type'],
        });

        expect(content).toBe(dedent`
          **User Name**

          **Type**: string
        `);
    });

    it('uses ellipsis to include remaining blocks', () => {
        const schema: JSONSchema = {
            type: 'string',
            title: 'User Name',
            description: 'Name of the user',
            default: 'guest',
            example: 'john_doe',
        };

        const content = renderSchema(schema, {
            blocks: ['title', 'description', '...', 'examples'],
        });

        expect(content).toBe(dedent`
          **User Name**

          Name of the user

          **Type**: string

          _Default:_{.json-schema-reset .json-schema-value} \`guest\`

          _Example:_{.json-schema-reset .json-schema-example} \`john_doe\`
        `);
    });

    it('uses default blocks when blocks is not specified', () => {
        const schema: JSONSchema = {
            type: 'string',
            title: 'User Name',
            description: 'Name of the user',
            default: 'guest',
            example: 'john_doe',
        };

        const content = renderSchema(schema, {suppressExamples: false});

        expect(content).toContain('**User Name**');
        expect(content).toContain('**Type**: string');
        expect(content).toContain('Name of the user');
        expect(content).toContain('_Default:_{.json-schema-reset .json-schema-value}');
        expect(content).toContain('_Example:_{.json-schema-reset .json-schema-example}');
    });

    it('renders deprecated block separately from title', () => {
        const schema: JSONSchema = {
            type: 'string',
            title: 'Old Field',
            deprecated: true,
            description: 'This field is deprecated',
        };

        const content = renderSchema(schema, {
            blocks: ['title', 'deprecated', 'type', 'description'],
            suppressExamples: true,
        });

        expect(content).toBe(dedent`
          **Old Field**

          _Deprecated_{.json-schema-reset .json-schema-deprecated-title}{title="This entity is deprecated and may be removed in future versions."}

          **Type**: string

          This field is deprecated
        `);
    });

    it('excludes blocks not in the list', () => {
        const schema: JSONSchema = {
            type: 'string',
            title: 'User Name',
            description: 'Name of the user',
            default: 'guest',
            minimum: 0,
            example: 'john_doe',
        };

        const content = renderSchema(schema, {
            blocks: ['title', 'type'],
        });

        expect(content).not.toContain('Name of the user');
        expect(content).not.toContain('Default');
        expect(content).not.toContain('Example');
        expect(content).not.toContain('Min value');
    });

    it('handles empty blocks array as default', () => {
        const schema: JSONSchema = {
            type: 'string',
            title: 'User Name',
            description: 'Name of the user',
        };

        const contentWithEmpty = renderSchema(schema, {
            blocks: [],
            suppressExamples: true,
        });

        const contentWithDefault = renderSchema(schema, {
            suppressExamples: true,
        });

        expect(contentWithEmpty).toBe(contentWithDefault);
    });
});
