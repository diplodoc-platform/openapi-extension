import type {Context} from '../index';

import stringify from 'json-stringify-safe';

import {anchor, block, bold, table, tableParameterName} from '../ui';
import {concatNewLine} from '../utils';
import {OpenJSONSchema, OpenJSONSchemaDefinition} from '../models';
import {getOrderedPropList} from '../ui/presentationUtils/orderedProps/getOrderedPropList';

import {collectRefs, extractOneOfElements, inferType, typeToText} from './types';
import {prepareComplexDescription} from './description';

type TableRow = [string, string];

export type TableRef = string;

type TableFromSchemaResult = {
    content: string;
    tableRefs: TableRef[];
};

export function tableFromSchema(schema: OpenJSONSchema, ctx: Context): TableFromSchemaResult {
    if (schema.enum) {
        // enum description will be in table description
        const description = prepareComplexDescription('', schema);
        const type = inferType(schema, ctx);

        const content = table([
            ['Type', 'Description'],
            [typeToText(type), description],
        ]);

        return {content, tableRefs: []};
    }

    if (schema.type === 'array') {
        const {type, ref} = prepareTableRowData({value: schema}, ctx);

        return {
            content: type,
            tableRefs: ref || [],
        };
    }

    const {rows, refs} = prepareObjectSchemaTable(schema, ctx);
    const content = rows.length ? table([['Name', 'Description'], ...rows]) : '';

    return {content, tableRefs: refs};
}

type PrepareObjectSchemaTableResult = {
    rows: TableRow[];
    refs: TableRef[];
};

function prepareObjectSchemaTable(
    schema: OpenJSONSchema,
    ctx: Context,
): PrepareObjectSchemaTableResult {
    const tableRef = ctx.refs.find(schema);
    const merged = ctx.refs.merge(schema, false);

    const result: PrepareObjectSchemaTableResult = {rows: [], refs: []};

    const wellOrderedProperties = getOrderedPropList({
        propList: Object.entries(merged.properties || {}),
        iteratee: ([propName]) => ({
            name: propName,
            isRequired: isRequired(propName, merged),
        }),
    });

    wellOrderedProperties.forEach(([key, v]) => {
        const value = ctx.refs.merge(v);
        const name = tableParameterName(key, {
            required: isRequired(key, merged),
            deprecated: value.deprecated,
        });
        const {type, description, ref} = prepareTableRowData(
            {value, key, parentRef: tableRef},
            ctx,
        );

        result.rows.push([name, block([`${bold('Type:')} ${type}`, description])]);

        if (ref) {
            result.refs.push(...ref);
        }

        for (const element of value.oneOf || []) {
            const mergedInner = ctx.refs.merge(element);
            const {ref: innerRef} = prepareTableRowData({value: mergedInner}, ctx);

            if (innerRef) {
                result.refs.push(...innerRef);
            }
        }
    });

    if (merged.oneOf?.length) {
        const oneOfElements = extractOneOfElements(schema);
        const oneOfElementsRefs = oneOfElements.map(
            (value) =>
                [value, value && ctx.refs.find(value)] as [OpenJSONSchema, string | undefined],
        );

        oneOfElementsRefs.forEach(([value, ref]) => {
            if (!ref) {
                return;
            }

            result.rows.push([
                '...rest',
                block([`${bold('oneOf')} ${anchor(ref)}`, value.description || '']),
            ]);

            result.refs.push(ref);
        });
    }

    return result;
}

type PrepareRowResult = {
    type: string;
    description: string;
    ref?: TableRef[];
};

export function prepareTableRowData(
    {
        value,
        key,
        parentRef,
    }: {
        value: OpenJSONSchema;
        key?: string;
        parentRef?: string;
    },
    ctx: Context,
): PrepareRowResult {
    const description = value.description || '';

    const type = inferType(value, ctx);

    if (type === 'array') {
        if (!value.items || value.items === true || Array.isArray(value.items)) {
            throw Error(`Unsupported array items for ${key}`);
        }

        const inner = prepareTableRowData({value: value.items, key, parentRef}, ctx);
        const innerDescription = inner.ref
            ? concatNewLine(description, inner.description)
            : description;

        const isUnionType = (inner.ref?.length || inner.type.split('\n').length || 0) > 1;
        const returnType = isUnionType ? `(${inner.type})[]` : `${inner.type}[]`;

        return {
            type: returnType,
            // if inner.ref present, inner description will be in separate table
            ref: inner.ref,
            description: prepareComplexDescription(innerDescription, value),
        };
    }

    const format = value.format === undefined ? '' : `&lt;${value.format}&gt;`;

    return {
        type: typeToText(type) + format,
        description: prepareComplexDescription(description, value),
        ref: collectRefs(type),
    };
}

function findNonNullOneOfElement(schema: OpenJSONSchema, ctx: Context): OpenJSONSchema {
    const isValid = (v: OpenJSONSchema) => {
        if (typeof inferType(v, ctx) === 'string') {
            return v;
        }

        const merged = ctx.refs.merge(v);

        if (Object.keys(merged.properties || {}).length) {
            if (v.oneOf?.length) {
                const option = v.oneOf[0];
                if (typeof option === 'object' && option.properties) {
                    v.properties = {...v.properties, ...option.properties};
                }
                delete v.oneOf;
            }
            return v;
        }

        if (merged.oneOf?.length) {
            return false;
        }

        return v;
    };

    const result = isValid(schema);

    if (result) {
        return result;
    }

    const stack = [...(schema.oneOf || [])];

    while (stack.length) {
        const v = stack.shift();

        if (!v || typeof v === 'boolean') {
            continue;
        }

        const status = isValid(v);

        if (status) {
            return status;
        }

        stack.push(...(v.oneOf || []));
    }

    throw new Error(`Unable to create sample element: \n ${stringify(schema, null, 2)}`);
}

export function prepareSampleObject(
    schema: OpenJSONSchema,
    callstack: OpenJSONSchema[],
    ctx: Context,
): Object | Array<Object> {
    const result: {[key: string]: unknown} = {};

    if (schema.example) {
        return schema.example;
    }

    if (schema.type === 'array') {
        if (Array.isArray(schema.items) || typeof schema.items !== 'object') {
            throw new Error(
                `Unable to create sample element for ${stringify(
                    schema,
                    null,
                    4,
                )}.\n You can pass only one scheme to items`,
            );
        }
        return [prepareSampleObject(schema.items, [], ctx)];
    }

    const merged = findNonNullOneOfElement(ctx.refs.merge(schema), ctx);

    Object.entries(merged.properties || {}).forEach(([key, value]) => {
        const required = isRequired(key, merged);
        const possibleValue = prepareSampleElement(key, value, required, callstack, ctx);

        if (possibleValue !== undefined) {
            result[key] = possibleValue;
        }
    });

    return result;
}

// eslint-disable-next-line
function prepareSampleElement(
    key: string,
    v: OpenJSONSchemaDefinition,
    required: boolean,
    callstack: OpenJSONSchema[],
    ctx: Context,
): unknown {
    const value = ctx.refs.merge(v);
    if (value.example) {
        return value.example;
    }

    if (value.enum?.length) {
        return value.enum[0];
    }

    if (value.default !== undefined) {
        return value.default;
    }

    const wasInCallstack = value._shallowCopyOf
        ? callstack.includes(value._shallowCopyOf)
        : callstack.includes(value);

    if (!required && wasInCallstack) {
        // stop recursive cyclic links
        return undefined;
    }

    const nextCallstackEntry = value._shallowCopyOf ?? value;
    const downCallstack = callstack.concat(nextCallstackEntry);
    const type = inferType(value, ctx);

    const schema = findNonNullOneOfElement(value, ctx);

    if (value.oneOf?.length) {
        return prepareSampleElement(key, schema, isRequired(key, value), downCallstack, ctx);
    }

    switch (type) {
        case 'object':
            return prepareSampleObject(schema, downCallstack, ctx);
        case 'array':
            if (!schema.items || schema.items === true || Array.isArray(schema.items)) {
                throw new Error(
                    `Unable to create sample element for ${stringify(
                        schema,
                        null,
                        4,
                    )}.\n You can pass only one scheme to items`,
                );
            }
            if (schema.items.oneOf) {
                return schema.items.oneOf.map((item) =>
                    prepareSampleElement(key, item, isRequired(key, schema), downCallstack, ctx),
                );
            }
            return [
                prepareSampleElement(
                    key,
                    schema.items,
                    isRequired(key, schema),
                    downCallstack,
                    ctx,
                ),
            ];
        case 'string':
            switch (schema.format) {
                case 'uuid':
                    return 'c3073b9d-edd0-49f2-a28d-b7ded8ff9a8b';
                case 'date-time':
                    return '2022-12-29T18:02:01Z';
                case 'binary':
                    return null;
                default:
                    return 'string';
            }
        case 'number':
        case 'integer':
            return 0;
        case 'boolean':
            return false;
    }

    if (schema.properties) {
        // if no "type" specified
        return prepareSampleObject(schema, downCallstack, ctx);
    }

    return undefined;
}

function isRequired(key: string, value: OpenJSONSchema): boolean {
    return value.required?.includes(key) ?? false;
}
