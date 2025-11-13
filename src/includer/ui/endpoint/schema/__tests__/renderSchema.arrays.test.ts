import type {JSONSchema} from '../renderSchema';

import {describe, expect, it} from 'vitest';
import dedent from 'ts-dedent';

import {renderSchema} from '../renderSchema';

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

      #| {.json-schema-properties}
      || **Name** | **Description** ||
      ||

      _foo_{.json-schema-reset .json-schema-property}
      {.table-cell}|
      **Type**: string

      Поле foo
      {.table-cell}
      ||
      ||

      _bar_{.json-schema-reset .json-schema-property}
      {.table-cell}|
      **Type**: integer

      Поле bar
      {.table-cell}
      ||
      |#

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

      #| {.json-schema-properties}
      || **Name** | **Description** ||
      ||

      _name_{.json-schema-reset .json-schema-property}
      {.table-cell}|
      **Type**: string

      Имя
      {.table-cell}
      ||
      |#

      {% endcut %}

      Коллекция пользователей
    `);
    });
});
