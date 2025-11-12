import type {JSONSchema} from '../index';

import {describe, expect, it} from 'vitest';
import dedent from 'ts-dedent';

import {renderSchema} from '../index';

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

          #|
          || **Name** | **Description** ||
          ||

          _address_{.json-schema-reset .json-schema-property}
          {.table-cell}|
          {% cut "**Type**: object" %}

          #|
          ||

          _city_{.json-schema-reset .json-schema-property}
          {.table-cell}|
          **Type**: string

          Город
          {.table-cell}
          ||
          ||

          _complex_{.json-schema-reset .json-schema-property}
          {.table-cell}|
          {% cut "**Type**: object" %}

          #|
          ||

          _someprop_{.json-schema-reset .json-schema-property}
          {.table-cell}|
          **Type**: string

          Дополнительное поле
          {.table-cell}
          ||
          |#{.json-schema-properties}

          {% endcut %}

          Сложная структура
          {.table-cell}
          ||
          ||

          _postcode_{.json-schema-reset .json-schema-property}
          {.table-cell}|
          **Type**: string

          Почтовый индекс
          {.table-cell}
          ||
          |#{.json-schema-properties}

          {% endcut %}

          Адрес пользователя
          {.table-cell}
          ||
          |#{.json-schema-properties}

          {% endcut %}

          Корневой объект адреса
        `);
    });

    it('renders object table without cut when expandType is true', () => {
        const schema: JSONSchema = {
            type: 'object',
            properties: {
                name: {type: 'string', description: 'Имя'},
            },
        };

        const content = renderSchema(schema, {
            suppressExamples: true,
            expandType: true,
        });

        expect(content).toBe(dedent`
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
        `);
    });

    it('renders nullable object with type note', () => {
        const schema: JSONSchema = {
            type: 'object',
            nullable: true,
            properties: {
                name: {type: 'string'},
            },
        };

        const content = renderSchema(schema, {suppressExamples: true});

        expect(content).toBe(dedent`
          {% cut "**Type**: object | null" %}

          #|
          || **Name** | **Description** ||
          ||

          _name_{.json-schema-reset .json-schema-property}
          {.table-cell}|
          **Type**: string
          {.table-cell}
          ||
          |#{.json-schema-properties}

          {% endcut %}
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

            #|
            || **Name** | **Description** ||
            ||

            _children_{.json-schema-reset .json-schema-property}
            {.table-cell}|
            {% cut "**Type**: object[]" %}

            #|
            ||

            _age_{.json-schema-reset .json-schema-property}
            {.table-cell}|
            **Type**: integer

            Возраст
            {.table-cell}
            ||
            ||

            _name_{.json-schema-reset .json-schema-property}
            {.table-cell}|
            **Type**: string

            Имя
            {.table-cell}
            ||
            |#{.json-schema-properties}

            {% endcut %}

            Массив детей
            {.table-cell}
            ||
            ||

            _type_{.json-schema-reset .json-schema-property}
            {.table-cell}|
            **Type**: string

            Тип записи
            {.table-cell}
            ||
            |#{.json-schema-properties}

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

      #|
      || **Name** | **Description** ||
      ||

      _[additional]_{.json-schema-reset .json-schema-additional-property}
      {.table-cell}|
      **Type**: string

      Любое строковое свойство
      {.table-cell}
      ||
      |#{.json-schema-properties}

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

          #|
          || **Name** | **Description** ||
          ||

          _/^foo.*$/_{.json-schema-reset .json-schema-pattern-property}
          {.table-cell}|
          **Type**: string

          Любая строка, начинающаяся с foo
          {.table-cell}
          ||
          |#{.json-schema-properties}

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

          #|
          || **Name** | **Description** ||
          ||

          _name_{.json-schema-reset .json-schema-property .json-schema-required}
          {.table-cell}|
          **Type**: string
          {.table-cell}
          ||
          ||

          _age_{.json-schema-reset .json-schema-property}
          {.table-cell}|
          **Type**: integer
          {.table-cell}
          ||
          |#{.json-schema-properties}

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

          #|
          || **Name** | **Description** ||
          ||

          _email_{.json-schema-reset .json-schema-property}
          {.table-cell}|
          **Type**: string
          {.table-cell}
          ||
          ||

          _password_{.json-schema-reset .json-schema-property}
          {.table-cell}|
          **Type**: string
          {.table-cell}
          ||
          |#{.json-schema-properties}

          {% endcut %}
        `);
    });

    it('orders properties using orderProperties option', () => {
        const schema: JSONSchema = {
            type: 'object',
            properties: {
                name: {type: 'string'},
                email: {type: 'string'},
                age: {type: 'integer'},
            },
        };

        const content = renderSchema(schema, {
            suppressExamples: true,
            orderProperties: (current) => {
                if (!current.properties) {
                    return undefined;
                }

                const order = ['email', 'name', 'age'];
                return order
                    .filter((key) => current.properties?.[key])
                    .map((key) => ({
                        name: key,
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        schema: current.properties![key]!,
                    }));
            },
        });

        expect(content).toBe(dedent`
          {% cut "**Type**: object" %}

          #|
          || **Name** | **Description** ||
          ||

          _email_{.json-schema-reset .json-schema-property}
          {.table-cell}|
          **Type**: string
          {.table-cell}
          ||
          ||

          _name_{.json-schema-reset .json-schema-property}
          {.table-cell}|
          **Type**: string
          {.table-cell}
          ||
          ||

          _age_{.json-schema-reset .json-schema-property}
          {.table-cell}|
          **Type**: integer
          {.table-cell}
          ||
          |#{.json-schema-properties}

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

          #|
          || **Name** | **Description** ||
          ||

          _email_{.json-schema-reset .json-schema-property}
          {.table-cell}|
          **Type**: string
          {.table-cell}
          ||
          ||

          _id_{.json-schema-reset .json-schema-property}
          {.table-cell}|
          **Type**: string
          {.table-cell}
          ||
          |#{.json-schema-properties}

          {% endcut %}
        `);
    });
});
