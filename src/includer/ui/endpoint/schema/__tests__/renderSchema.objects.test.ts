import type {JSONSchema} from '../renderSchema';

import {describe, expect, it} from 'vitest';
import dedent from 'ts-dedent';

import {renderSchema} from '../renderSchema';

describe('renderSchema - objects', () => {
    it('renders deeply nested object with descriptions', () => {
        const schema: JSONSchema = {
            type: 'object',
            description: 'Корневой объект адреса',
            properties: {
                address: {
                    type: 'object',
                    description: 'Адрес пользователя',
                    properties: {
                        city: {type: 'string', description: 'Город'},
                        postcode: {type: 'string', description: 'Почтовый индекс'},
                        complex: {
                            type: 'object',
                            description: 'Сложная структура',
                            properties: {
                                someprop: {type: 'string', description: 'Дополнительное поле'},
                            },
                        },
                    },
                },
            },
        };

        const content = renderSchema(schema, {suppressExamples: true});
        expect(content).toBe(dedent`
      {% cut "**Type**: object" %}

      #| {.json-schema-properties}
      || Name | Description ||
      ||
      _address_{.json-schema-reset .json-schema-property}
      |
      {% cut "**Type**: object" %}

      #| {.json-schema-properties}
      ||
      _city_{.json-schema-reset .json-schema-property}
      |
      **Type**: string

      Город
      ||
      ||
      _postcode_{.json-schema-reset .json-schema-property}
      |
      **Type**: string

      Почтовый индекс
      ||
      ||
      _complex_{.json-schema-reset .json-schema-property}
      |
      {% cut "**Type**: object" %}

      #| {.json-schema-properties}
      ||
      _someprop_{.json-schema-reset .json-schema-property}
      |
      **Type**: string

      Дополнительное поле
      ||
      |#

      {% endcut %}

      Сложная структура
      ||
      |#

      {% endcut %}

      Адрес пользователя
      ||
      |#

      {% endcut %}

      Корневой объект адреса
    `);
    });

    it('renders object with array of objects', () => {
        const schema: JSONSchema = {
            type: 'object',
            description: 'Объект с массивом',
            properties: {
                children: {
                    type: 'array',
                    description: 'Массив детей',
                    items: {
                        type: 'object',
                        description: 'Ребёнок',
                        properties: {
                            name: {type: 'string', description: 'Имя'},
                            age: {type: 'integer', description: 'Возраст'},
                        },
                    },
                },
                type: {type: 'string', description: 'Тип записи'},
            },
        };

        const content = renderSchema(schema, {suppressExamples: true});
        expect(content).toBe(dedent`
      {% cut "**Type**: object" %}

      #| {.json-schema-properties}
      || Name | Description ||
      ||
      _children_{.json-schema-reset .json-schema-property}
      |
      {% cut "**Type**: object[]" %}

      #| {.json-schema-properties}
      ||
      _name_{.json-schema-reset .json-schema-property}
      |
      **Type**: string

      Имя
      ||
      ||
      _age_{.json-schema-reset .json-schema-property}
      |
      **Type**: integer

      Возраст
      ||
      |#

      {% endcut %}

      Массив детей
      ||
      ||
      _type_{.json-schema-reset .json-schema-property}
      |
      **Type**: string

      Тип записи
      ||
      |#

      {% endcut %}

      Объект с массивом
    `);
    });

    it('renders object without properties and with additionalProperties', () => {
        const schema: JSONSchema = {
            type: 'object',
            description: 'Объект c additionalProperties',
            additionalProperties: {type: 'string', description: 'Любое строковое свойство'},
        };

        const content = renderSchema(schema, {suppressExamples: true});
        expect(content).toBe(dedent`
      {% cut "**Type**: object" %}

      #| {.json-schema-properties}
      || Name | Description ||
      ||
      _[additional]_{.json-schema-reset .json-schema-additional-property}
      |
      **Type**: string

      Любое строковое свойство
      ||
      |#

      {% endcut %}

      Объект c additionalProperties
    `);
    });

    it('renders patternProperties inside object table', () => {
        const schema: JSONSchema = {
            type: 'object',
            patternProperties: {
                '^foo.*$': {type: 'string', description: 'Любая строка, начинающаяся с foo'},
            },
        };

        const content = renderSchema(schema, {suppressExamples: true});
        expect(content).toBe(dedent`
      {% cut "**Type**: object" %}

      #| {.json-schema-properties}
      || Name | Description ||
      ||
      _/^foo.*$/_{.json-schema-reset .json-schema-pattern-property}
      |
      **Type**: string

      Любая строка, начинающаяся с foo
      ||
      |#

      {% endcut %}
    `);
    });

    it('marks required properties with additional class', () => {
        const schema: JSONSchema = {
            type: 'object',
            properties: {
                name: {type: 'string'},
                age: {type: 'integer'},
            },
            required: ['name'],
        };

        const content = renderSchema(schema, {suppressExamples: true});
        expect(content).toBe(dedent`
      {% cut "**Type**: object" %}

      #| {.json-schema-properties}
      || Name | Description ||
      ||
      _name_{.json-schema-reset .json-schema-property .json-schema-required}
      |
      **Type**: string
      ||
      ||
      _age_{.json-schema-reset .json-schema-property}
      |
      **Type**: integer
      ||
      |#

      {% endcut %}
    `);
    });

    it('hides readOnly properties in writeOnly mode', () => {
        const schema: JSONSchema = {
            type: 'object',
            properties: {
                id: {type: 'string', readOnly: true},
                password: {type: 'string', writeOnly: true},
                email: {type: 'string'},
            },
        };

        const content = renderSchema(schema, {writeOnly: true, suppressExamples: true});

        expect(content).toBe(dedent`
      {% cut "**Type**: object" %}

      #| {.json-schema-properties}
      || Name | Description ||
      ||
      _password_{.json-schema-reset .json-schema-property}
      |
      **Type**: string
      ||
      ||
      _email_{.json-schema-reset .json-schema-property}
      |
      **Type**: string
      ||
      |#

      {% endcut %}
    `);
    });

    it('hides writeOnly properties in readOnly mode', () => {
        const schema: JSONSchema = {
            type: 'object',
            properties: {
                id: {type: 'string', readOnly: true},
                password: {type: 'string', writeOnly: true},
                email: {type: 'string'},
            },
        };

        const content = renderSchema(schema, {readOnly: true, suppressExamples: true});

        expect(content).toBe(dedent`
      {% cut "**Type**: object" %}

      #| {.json-schema-properties}
      || Name | Description ||
      ||
      _id_{.json-schema-reset .json-schema-property}
      |
      **Type**: string
      ||
      ||
      _email_{.json-schema-reset .json-schema-property}
      |
      **Type**: string
      ||
      |#

      {% endcut %}
    `);
    });
});
