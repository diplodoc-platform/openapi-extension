import type {JSONSchema} from '../index';

import {describe, expect, it} from 'vitest';
import dedent from 'ts-dedent';

import {renderSchema} from '../index';

describe('renderSchema - arrays', () => {
    it('renders array of primitives as bracket notation with description', () => {
        const schema: JSONSchema = {
            type: 'array',
            description: 'Массив строк',
            items: {type: 'string', description: 'Строка'},
        };

        const content = renderSchema(schema, {suppressExamples: true});
        expect(content).toBe(dedent`
      **Type**: string[]

      Массив строк
    `);
    });

    it('renders array of objects as cut with table', () => {
        const schema: JSONSchema = {
            type: 'array',
            description: 'Список сущностей',
            items: {
                type: 'object',
                description: 'Элемент списка',
                properties: {
                    foo: {type: 'string', description: 'Поле foo'},
                    bar: {type: 'integer', description: 'Поле bar'},
                },
            },
        };

        const content = renderSchema(schema, {suppressExamples: true});
        expect(content).toBe(dedent`
      {% cut "**Type**: object[]" %}

      #|
      || **Name** | **Description** ||
      ||

      _bar_{.json-schema-reset .json-schema-property}
      {.table-cell}|
      **Type**: integer

      Поле bar
      {.table-cell}
      ||
      ||

      _foo_{.json-schema-reset .json-schema-property}
      {.table-cell}|
      **Type**: string

      Поле foo
      {.table-cell}
      ||
      |#{.json-schema-properties}

      {% endcut %}

      Список сущностей
    `);
    });

    it('renders nested array of primitives using bracket notation', () => {
        const schema: JSONSchema = {
            type: 'array',
            description: 'Матрица строк',
            items: {
                type: 'array',
                items: {type: 'string'},
            },
        };

        const content = renderSchema(schema, {suppressExamples: true});
        expect(content).toBe(dedent`
      **Type**: string[][]

      Матрица строк
    `);
    });

    it('renders array of objects with description on items', () => {
        const schema: JSONSchema = {
            type: 'array',
            description: 'Коллекция пользователей',
            items: {
                type: 'object',
                description: 'Пользователь',
                properties: {
                    name: {type: 'string', description: 'Имя'},
                },
            },
        };

        const content = renderSchema(schema, {suppressExamples: true});
        expect(content).toBe(dedent`
      {% cut "**Type**: object[]" %}

      #|
      || **Name** | **Description** ||
      ||

      _name_{.json-schema-reset .json-schema-property}
      {.table-cell}|
      **Type**: string

      Имя
      {.table-cell}
      ||
      |#{.json-schema-properties}

      {% endcut %}

      Коллекция пользователей
    `);
    });

    it('renders nullable array type', () => {
        const schema: JSONSchema = {
            type: 'array',
            nullable: true,
            description: 'Опциональный список идентификаторов',
            items: {type: 'string'},
        };

        const content = renderSchema(schema, {suppressExamples: true});

        expect(content).toBe(dedent`
      **Type**: string[] | null

      Опциональный список идентификаторов
    `);
    });

    it('renders array of referenced objects as label with brackets', () => {
        const counterSchema: JSONSchema = {
            type: 'object',
            properties: {
                goals: {
                    type: 'array',
                    description: 'Список структур с информацией о целях счетчика.',
                    items: {
                        $ref: '#/components/schemas/goal',
                    },
                },
            },
        };

        const goalSchema: JSONSchema = {
            type: 'object',
            properties: {
                id: {type: 'integer'},
            },
        };

        const content = renderSchema(counterSchema, {
            suppressExamples: true,
            ref: (refId) => {
                if (refId === '#/components/schemas/goal') {
                    return {
                        href: '#entity-goal',
                        label: 'goal',
                        schema: goalSchema,
                    };
                }

                return undefined;
            },
        });

        expect(content).toBe(dedent`
      {% cut "**Type**: object" %}

      #|
      || **Name** | **Description** ||
      ||

      _goals_{.json-schema-reset .json-schema-property}
      {.table-cell}|
      **Type**: [goal](#entity-goal)[]

      Список структур с информацией о целях счетчика.
      {.table-cell}
      ||
      |#{.json-schema-properties}

      {% endcut %}
    `);
    });

    it('renders array of combinator-based items as cut with nested variants', () => {
        const schema: JSONSchema = {
            type: 'array',
            description: 'Список целей',
            example: [{id: 1}],
            items: {
                oneOf: [
                    {$ref: '#/components/schemas/UrlGoal'},
                    {$ref: '#/components/schemas/VisitDurationGoal'},
                ],
            },
        };

        const urlGoalSchema: JSONSchema = {
            type: 'object',
            properties: {
                id: {type: 'integer'},
            },
        };

        const visitDurationGoalSchema: JSONSchema = {
            type: 'object',
            properties: {
                duration: {type: 'integer'},
            },
        };

        const content = renderSchema(schema, {
            ref: (refId) => {
                if (refId === '#/components/schemas/UrlGoal') {
                    return {
                        href: '#entity-UrlGoal',
                        label: 'UrlGoal',
                        schema: urlGoalSchema,
                    };
                }

                if (refId === '#/components/schemas/VisitDurationGoal') {
                    return {
                        href: '#entity-VisitDurationGoal',
                        label: 'VisitDurationGoal',
                        schema: visitDurationGoalSchema,
                    };
                }

                return undefined;
            },
        });

        // Type for the array itself
        expect(content).toContain('{% cut "**Type**: array" %}');
        // Examples and description should NOT be rendered at the array cut level (between cut opening and combinators)
        // They should be rendered at the table cell level (when array is a property), not inside the cut
        const cutIndex = content.indexOf('{% cut "**Type**: array" %}');
        const combinatorsIndex = content.indexOf('**One of 2 types**', cutIndex);
        const contentBetweenCutAndCombinators = content.slice(cutIndex, combinatorsIndex);
        // Array-level example should not appear between cut and combinators
        expect(contentBetweenCutAndCombinators).not.toContain('"id": 1');
        // Array-level description should not appear between cut and combinators
        // (it will be rendered at the table cell level when array is used as a property)
        expect(contentBetweenCutAndCombinators).not.toContain('Список целей');

        // Nested combinator variants should be rendered inside the cut
        expect(content).toContain('**One of 2 types**');
        expect(content).toContain('[UrlGoal](#entity-UrlGoal)');
        expect(content).toContain('[VisitDurationGoal](#entity-VisitDurationGoal)');

        // Examples should be rendered in each oneOf variant (if variants have examples)
        // Check that examples appear within the oneOf cut block, not at the array cut level
        const oneOfCutIndex = content.indexOf('**One of 2 types**');
        expect(oneOfCutIndex).toBeGreaterThan(-1);
        // Examples from array should appear in variants if they have them, or in nested schemas
    });

    it('renders examples in nested schemas within combinator variants', () => {
        const schema: JSONSchema = {
            type: 'array',
            description: 'Список целей',
            example: [{id: 1}],
            items: {
                oneOf: [
                    {
                        $ref: '#/components/schemas/UrlGoal',
                    },
                    {
                        $ref: '#/components/schemas/VisitDurationGoal',
                    },
                ],
            },
        };

        const urlGoalSchema: JSONSchema = {
            type: 'object',
            properties: {
                id: {type: 'integer', example: 42},
                url: {type: 'string', example: 'https://example.com'},
            },
        };

        const visitDurationGoalSchema: JSONSchema = {
            type: 'object',
            properties: {
                duration: {type: 'integer', example: 60},
            },
        };

        const content = renderSchema(schema, {
            ref: (refId) => {
                if (refId === '#/components/schemas/UrlGoal') {
                    return {
                        href: '#entity-UrlGoal',
                        label: 'UrlGoal',
                        schema: urlGoalSchema,
                    };
                }

                if (refId === '#/components/schemas/VisitDurationGoal') {
                    return {
                        href: '#entity-VisitDurationGoal',
                        label: 'VisitDurationGoal',
                        schema: visitDurationGoalSchema,
                    };
                }

                return undefined;
            },
        });

        // Array-level example should NOT be rendered at the cut level (between cut opening and combinators)
        // Examples should be rendered in each oneOf variant and in nested schemas
        const cutIndex = content.indexOf('{% cut "**Type**: array" %}');
        const combinatorsIndex = content.indexOf('**One of 2 types**', cutIndex);
        const contentBetweenCutAndCombinators = content.slice(cutIndex, combinatorsIndex);
        // Array example should not appear between cut and combinators
        expect(contentBetweenCutAndCombinators).not.toContain('"id": 1');

        // Nested examples should be rendered in variant schemas and their properties
        // These are the key checks - examples from nested properties should appear
        expect(content).toContain('42'); // example from id property in UrlGoal
        expect(content).toContain('https://example.com'); // example from url property in UrlGoal
        expect(content).toContain('60'); // example from duration property in VisitDurationGoal
    });
});
