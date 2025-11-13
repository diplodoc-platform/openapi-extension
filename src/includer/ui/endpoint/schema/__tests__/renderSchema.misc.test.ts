import type {JSONSchema} from '../renderSchema';

import {describe, expect, it} from 'vitest';
import dedent from 'ts-dedent';

import {renderSchema} from '../renderSchema';

describe('renderSchema - miscellaneous', () => {
    it('applies before and after wrappers', () => {
        const schema: JSONSchema = {type: 'string', description: 'Простая строка'};

        const content = renderSchema(schema, {before: '# Schema', after: '---'});

        expect(content).toBe(dedent`
      # Schema

      **Type**: string

      Простая строка

      {% cut "**Examples**" %}

      \`example\`

      {% endcut %}

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

      {% cut "**Examples**" %}

      \`example\`

      {% endcut %}
    `);
    });

    it('renders string format inline with type', () => {
        const schema: JSONSchema = {
            type: 'string',
            format: 'uuid',
        };

        const content = renderSchema(schema);

        expect(content).toBe(dedent`
      **Type**: string<uuid>

      {% cut "**Examples**" %}

      \`123e4567-e89b-12d3-a456-426614174000\`

      {% endcut %}
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

      **Default**: \`0\`

      _Min value:_{.json-schema-reset .json-schema-assertion} \`0\`

      {% cut "**Examples**" %}

      \`0\`

      {% endcut %}
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
            },
        });

        expect(content).toBe(dedent`
      **Тип**: string

      Персонализированное описание

      {% cut "**Примеры**" %}

      \`example\`

      {% endcut %}
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

      **Enum**: \`alpha\`, \`beta\`
    `);
    });
});
