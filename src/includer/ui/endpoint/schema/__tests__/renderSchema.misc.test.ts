import type {JSONSchema} from '../index';

import {describe, expect, it} from 'vitest';
import dedent from 'ts-dedent';

import {renderSchema} from '../index';

describe('renderSchema - miscellaneous', () => {
    it('applies before and after wrappers', () => {
        const schema: JSONSchema = {type: 'string', description: 'Простая строка'};

        const content = renderSchema(schema, {before: '# Schema', after: '---'});

        expect(content).toBe(dedent`
          # Schema

          **Type**: string

          Простая строка

          _Example:_{.json-schema-reset .json-schema-example} \`example\`

          ---
        `);
    });

    it('renders union type array type list', () => {
        const schema: JSONSchema = {
            type: ['string', 'null'],
            description: 'Строка или null',
        };

        const content = renderSchema(schema);

        expect(content).toBe(dedent`
          **Type**: string | null

          Строка или null

          _Example:_{.json-schema-reset .json-schema-example} \`example\`
        `);
    });

    it('renders nullable primitive type', () => {
        const schema: JSONSchema = {
            type: 'string',
            nullable: true,
        };

        const content = renderSchema(schema, {suppressExamples: true});

        expect(content).toBe(dedent`
          **Type**: string | null
        `);
    });

    it('renders string format inline with type', () => {
        const schema: JSONSchema = {
            type: 'string',
            format: 'uuid',
        };

        const content = renderSchema(schema);

        expect(content).toBe(dedent`
          **Type**: string&lt;uuid&gt;

          _Example:_{.json-schema-reset .json-schema-example} \`123e4567-e89b-12d3-a456-426614174000\`
        `);
    });

    it('does not duplicate null when nullable union already includes null', () => {
        const schema: JSONSchema = {
            type: ['string', 'null'],
            nullable: true,
        };

        const content = renderSchema(schema, {suppressExamples: true});

        expect(content).toBe(dedent`
          **Type**: string | null
        `);
    });

    it('renders values block before assertions', () => {
        const schema: JSONSchema = {
            type: 'number',
            default: 0,
            minimum: 0,
        };

        const content = renderSchema(schema);

        expect(content).toBe(dedent`
          **Type**: number

          _Default:_{.json-schema-reset .json-schema-value} \`0\`

          _Min value:_{.json-schema-reset .json-schema-assertion} \`0\`
        `);
    });

    it('respects i18n overrides for common labels', () => {
        const schema: JSONSchema = {
            type: 'string',
            description: 'Персонализированное описание',
        };

        const content = renderSchema(schema, {
            i18n: {
                type: 'Тип',
                examples: 'Примеры',
                example: 'Пример',
            },
        });

        expect(content).toBe(dedent`
          **Тип**: string

          Персонализированное описание

          _Пример:_{.json-schema-reset .json-schema-example} \`example\`
        `);
    });

    it('skips examples for string enum', () => {
        const schema: JSONSchema = {
            type: 'string',
            enum: ['alpha', 'beta'],
        };

        const content = renderSchema(schema);

        expect(content).toBe(dedent`
          **Type**: string

          _Enum:_{.json-schema-reset .json-schema-value} \`alpha\`, \`beta\`
        `);
    });
});
