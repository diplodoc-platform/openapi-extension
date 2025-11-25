import type {JSONSchema} from '../index';

import {describe, expect, it, vi} from 'vitest';
import dedent from 'ts-dedent';

import {renderSchema} from '../index';

describe('renderSchema - references', () => {
    it('uses ref callback to format $ref label', () => {
        const ref = vi.fn((refId: string) => ({
            label: refId.split('/').pop() ?? refId,
            href: '#' + refId.slice(2).replace(/\//g, '-'),
            schema: {},
        }));

        const schema: JSONSchema = {
            type: 'object',
            properties: {
                address: {
                    $ref: '#/definitions/Address',
                    description: 'Ссылка на адрес',
                },
            },
        };

        const content = renderSchema(schema, {ref, suppressExamples: true});

        expect(ref).toHaveBeenCalledWith('#/definitions/Address');
        expect(content).toBe(dedent`
          {% cut "**Type**: object" %}

          #|
          || **Name** | **Description** ||
          ||

          _address_{.json-schema-reset .json-schema-property}
          {.table-cell}|
          **Type**: [Address](#definitions-Address)

          Ссылка на адрес
          {.table-cell}
          ||
          |#{.json-schema-properties}

          {% endcut %}
        `);
    });

    it('renders array of $ref using resolver', () => {
        const ref = vi.fn((refId: string) => ({
            label: refId.split('/').pop() ?? refId,
            href: '#' + refId.slice(2).replace(/\//g, '-'),
            schema: {},
        }));

        const schema: JSONSchema = {
            type: 'array',
            description: 'Коллекция адресов',
            items: {
                $ref: '#/definitions/Address',
            },
        };

        const content = renderSchema(schema, {ref, suppressExamples: true});

        expect(ref).toHaveBeenCalledWith('#/definitions/Address');
        expect(content).toBe(dedent`
          **Type**: [Address](#definitions-Address)[]

          Коллекция адресов
        `);
    });

    it('renders nested array of $ref with bracket notation', () => {
        const ref = vi.fn((refId: string) => ({
            label: refId.split('/').pop() ?? refId,
            href: '#' + refId.slice(2).replace(/\//g, '-'),
            schema: {},
        }));

        const schema: JSONSchema = {
            type: 'array',
            description: 'Матрица ссылок',
            items: {
                type: 'array',
                items: {
                    $ref: '#/definitions/Node',
                },
            },
        };

        const content = renderSchema(schema, {ref, suppressExamples: true});

        expect(ref).toHaveBeenCalledWith('#/definitions/Node');
        expect(content).toBe(dedent`
          **Type**: [Node](#definitions-Node)[][]

          Матрица ссылок
        `);
    });

    it('renders top-level $ref with before/after', () => {
        const ref = vi.fn((refId: string) => ({
            label: refId.split('/').pop() ?? refId,
            href: '#' + refId.slice(2).replace(/\//g, '-'),
            schema: {},
        }));

        const schema: JSONSchema = {
            $ref: '#/definitions/Address',
            description: 'Ссылка на определение адреса',
        };

        const content = renderSchema(schema, {
            before: '# Header',
            after: '---',
            ref,
            suppressExamples: true,
        });

        expect(content).toBe(dedent`
          # Header

          **Type**: [Address](#definitions-Address)

          Ссылка на определение адреса

          ---
        `);
    });

    it('falls back to description provided by ref metadata', () => {
        const ref = vi.fn((_refId: string) => ({
            label: 'Address',
            href: '#address',
            schema: {description: 'Описание адреса'},
        }));

        const schema: JSONSchema = {
            $ref: '#/definitions/Address',
        };

        const content = renderSchema(schema, {ref, suppressExamples: true});

        expect(content).toBe(dedent`
          **Type**: [Address](#address)

          Описание адреса
        `);
    });

    it('renders nullable $ref as union with null', () => {
        const ref = vi.fn((_refId: string) => ({
            label: 'User',
            href: '#user',
            schema: {},
        }));

        const schema: JSONSchema = {
            $ref: '#/definitions/User',
            nullable: true,
        };

        const content = renderSchema(schema, {ref, suppressExamples: true});

        expect(content).toBe(dedent`
          **Type**: [User](#user) | null
        `);
    });
});
