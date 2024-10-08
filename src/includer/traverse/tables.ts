import stringify from 'json-stringify-safe';

import RefsService from '../services/refs';
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

export function tableFromSchema(schema: OpenJSONSchema): TableFromSchemaResult {
    if (schema.enum) {
        // enum description will be in table description
        const description = prepareComplexDescription('', schema);
        const type = inferType(schema);

        const content = table([
            ['Type', 'Description'],
            [typeToText(type), description],
        ]);

        return {content, tableRefs: []};
    }

    if (schema.type === 'array') {
        const {type, ref} = prepareTableRowData(schema);

        return {
            content: type,
            tableRefs: ref || [],
        };
    }

    const {rows, refs} = prepareObjectSchemaTable(schema);
    const content = rows.length ? table([['Name', 'Description'], ...rows]) : '';

    return {content, tableRefs: refs};
}

type PrepareObjectSchemaTableResult = {
    rows: TableRow[];
    refs: TableRef[];
};

function prepareObjectSchemaTable(schema: OpenJSONSchema): PrepareObjectSchemaTableResult {
    const tableRef = RefsService.find(schema);
    const merged = RefsService.merge(schema, false);

    const result: PrepareObjectSchemaTableResult = {rows: [], refs: []};

    const wellOrderedProperties = getOrderedPropList({
        propList: Object.entries(merged.properties || {}),
        iteratee: ([propName]) => ({
            name: propName,
            isRequired: isRequired(propName, merged),
        }),
    });

    wellOrderedProperties.forEach(([key, v]) => {
        const value = RefsService.merge(v);
        const name = tableParameterName(key, {
            required: isRequired(key, merged),
            deprecated: value.deprecated,
        });
        const {type, description, ref, runtimeRef} = prepareTableRowData(value, key, tableRef);

        result.rows.push([name, block([`${bold('Type:')} ${type}`, description])]);

        if (ref) {
            result.refs.push(...ref);
        }

        if (runtimeRef) {
            result.refs.push(runtimeRef);
        }

        for (const element of value.oneOf || []) {
            const mergedInner = RefsService.merge(element);
            const {ref: innerRef} = prepareTableRowData(mergedInner);

            if (innerRef) {
                result.refs.push(...innerRef);

                continue;
            }

            if (runtimeRef) {
                result.refs.push(runtimeRef);
            }
        }
    });

    if (merged.oneOf?.length) {
        const oneOfElements = extractOneOfElements(schema);
        const oneOfElementsRefs = oneOfElements.map(
            (value) =>
                [value, value && RefsService.find(value)] as [OpenJSONSchema, string | undefined],
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
    /*
     * if object has no ref in RefsService
     * then we will create runtime ref and render it later
     */
    runtimeRef?: string;
};

export function prepareTableRowData(
    value: OpenJSONSchema,
    key?: string,
    parentRef?: string,
): PrepareRowResult {
    const description = value.description || '';
    const propertyRef = parentRef && key && `${parentRef}-${key}`;

    const type = inferType(value);

    if (type === 'array') {
        if (!value.items || value.items === true || Array.isArray(value.items)) {
            throw Error(`Unsupported array items for ${key}`);
        }

        const inner = prepareTableRowData(value.items, key, parentRef);
        const innerDescription = inner.ref
            ? concatNewLine(description, inner.description)
            : description;

        if (RefsService.isRuntimeAllowed() && inner.runtimeRef) {
            RefsService.runtime(inner.runtimeRef, value.items);

            return {
                type: `${anchor(inner.runtimeRef, key)}[]`,
                runtimeRef: inner.runtimeRef,
                description: prepareComplexDescription(innerDescription, value),
            };
        }

        const isUnionType = (inner.ref?.length || inner.type.split('\n').length || 0) > 1;
        const returnType = isUnionType ? `(${inner.type})[]` : `${inner.type}[]`;

        return {
            type: returnType,
            // if inner.ref present, inner description will be in separate table
            ref: inner.ref,
            description: prepareComplexDescription(innerDescription, value),
        };
    }

    if (RefsService.isRuntimeAllowed() && propertyRef && type === 'object') {
        RefsService.runtime(propertyRef, value);

        return {
            type: anchor(propertyRef, key),
            runtimeRef: propertyRef,
            description: prepareComplexDescription(description, value),
        };
    }

    const format = value.format === undefined ? '' : `&lt;${value.format}&gt;`;

    return {
        type: typeToText(type) + format,
        description: prepareComplexDescription(description, value),
        ref: collectRefs(type),
    };
}

function findNonNullOneOfElement(schema: OpenJSONSchema): OpenJSONSchema {
    const isValid = (v: OpenJSONSchema) => {
        if (typeof inferType(v) === 'string') {
            return v;
        }

        const merged = RefsService.merge(v);

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
    callstack: OpenJSONSchema[] = [],
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
        return [prepareSampleObject(schema.items)];
    }

    const merged = findNonNullOneOfElement(RefsService.merge(schema));

    Object.entries(merged.properties || {}).forEach(([key, value]) => {
        const required = isRequired(key, merged);
        const possibleValue = prepareSampleElement(key, value, required, callstack);

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
): unknown {
    const value = RefsService.merge(v);
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
    const type = inferType(value);

    const schema = findNonNullOneOfElement(value);

    if (value.oneOf?.length) {
        return prepareSampleElement(key, schema, isRequired(key, value), downCallstack);
    }

    switch (type) {
        case 'object':
            return prepareSampleObject(schema, downCallstack);
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
                    prepareSampleElement(key, item, isRequired(key, schema), downCallstack),
                );
            }
            return [
                prepareSampleElement(key, schema.items, isRequired(key, schema), downCallstack),
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
        return prepareSampleObject(schema, downCallstack);
    }

    return undefined;
}

function isRequired(key: string, value: OpenJSONSchema): boolean {
    return value.required?.includes(key) ?? false;
}
