import RefsService from '../services/refs';
import stringify from 'json-stringify-safe';

import {anchor, table, tableParameterName, title} from '../ui';
import {concatNewLine} from '../utils';
import {EOL} from '../constants';
import {OpenJSONSchema, OpenJSONSchemaDefinition} from '../models';
import {
    collectRefs,
    descriptionForOneOfElement,
    extractOneOfElements,
    inferType,
    typeToText,
} from './types';

type TableRow = [string, string, string];

export type TableRef = string;

type TableFromSchemaResult = {
    content: string;
    tableRefs: TableRef[];
    oneOfRefs?: TableRef[];
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
    let content = rows.length ? table([['Name', 'Type', 'Description'], ...rows]) : '';

    if (schema.oneOf?.length) {
        const oneOfElements = extractOneOfElements(schema);
        const oneOfElementsRefs = oneOfElements
            .map((value) => value && RefsService.find(value))
            .filter(Boolean) as string[];

        content += EOL + title(4)('Or value from:') + EOL;

        refs.push(...oneOfElementsRefs);

        return {content, tableRefs: refs, oneOfRefs: oneOfElementsRefs};
    }

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

    Object.entries(merged.properties || {}).forEach(([key, v]) => {
        const value = RefsService.merge(v);
        const name = tableParameterName(key, isRequired(key, merged));
        const {type, description, ref, runtimeRef} = prepareTableRowData(value, key, tableRef);

        result.rows.push([name, type, description]);

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

    if (schema.oneOf?.length) {
        const restElementsDescription = descriptionForOneOfElement(schema, true);

        result.rows.push(['...rest', 'oneOf', restElementsDescription]);
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
                description: innerDescription,
            };
        }

        const isUnionType = (inner.ref?.length || inner.type.split('\n').length || 0) > 1;
        const returnType = isUnionType ? `(${inner.type})[]` : `${inner.type}[]`;

        return {
            type: returnType,
            // if inner.ref present, inner description will be in separate table
            ref: inner.ref,
            description: innerDescription,
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

function prepareComplexDescription(baseDescription: string, value: OpenJSONSchema): string {
    let description = baseDescription + EOL; 

    const enumValues = value.enum?.map((s) => `\`${s}\``).join(', ');

    if (typeof enumValues !== 'undefined') {
        description = concatNewLine(
            description,
            `<span style="color:gray;">Enum</span>: ${enumValues}`,
        );
    }

    if (typeof value.default !== 'undefined') {
        description = concatNewLine(
            description,
            `<span style="color:gray;">Default</span>: \`${value.default}\``,
        );
    }

    if (typeof value.example !== 'undefined') {
        description = concatNewLine(
            description,
            `<span style="color:gray;">Example</span>: \`${value.example}\``,
        );
    }

    if (typeof value.minLength !== 'undefined') {
        description = concatNewLine(
            description,
            `<span style="color:gray;">Min length</span>: \`${value.minLength}\``,
        );
    }

    if (typeof value.maxLength !== 'undefined') {
        description = concatNewLine(
            description,
            `<span style="color:gray;">Max length</span>: \`${value.maxLength}\``,
        );
    }

    return description;
}

function findNonNullOneOfElement(schema: OpenJSONSchema): OpenJSONSchema {
    const isValid = (v: OpenJSONSchema) => {
        if (typeof inferType(v) === 'string') {
            return v;
        }

        const merged = RefsService.merge(v);

        if (Object.keys(merged.properties || {}).length) {
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

    if (!required && callstack.includes(value)) {
        // stop recursive cyclic links
        return undefined;
    }

    const downCallstack = callstack.concat(value);
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
