import {descriptionForOneOfElement} from '../traverse/types';
import {OpenJSONSchema, OpenJSONSchemaDefinition, Refs} from '../models';
import {concatNewLine} from '../utils';

let allowRuntime: boolean;
let _refs: Refs = {};

function init(allRefs: Refs, allowAnonymousObjects?: boolean) {
    _refs = allRefs;
    allowRuntime = Boolean(allowAnonymousObjects);
}

/**
 *  find dereferenced object from schema in all components/schemas
 * @param value target spec
 * @returns refference of target or undefiend
 */
function find(value: OpenJSONSchema): string | undefined {
    for (const [k, v] of Object.entries(_refs)) {
        // @apidevtools/swagger-parser guaranties, that in refs list there will be the same objects
        // but same objects can have different descriptions
        if (v.properties && v.properties === value.properties) {
            return k;
        }
        if (v.allOf && v.allOf === value.allOf) {
            return k;
        }
        if (v.oneOf && v.oneOf === value.oneOf) {
            return k;
        }
        if (v.enum && v.enum === value.enum) {
            return k;
        }
    }
    return undefined;
}

// unwrapping such samples
// custom:
//   additionalProperties:
//     allOf:
//     - $ref: '#/components/schemas/TimeInterval1'
//   description: asfsdfsdf
//   type: object
// OR
// custom:
//   items:
//     allOf:
//       - $ref: '#/components/schemas/TimeInterval1'
//   description: asfsdfsdf
//   type: object
// eslint-disable-next-line complexity
function merge(schema: OpenJSONSchemaDefinition, needToSaveRef = true): OpenJSONSchema {
    if (typeof schema === 'boolean') {
        throw Error("Boolean value isn't supported");
    }

    if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
        const result = schema.additionalProperties;

        result.description = schema.description;

        return merge(result);
    }

    if (schema.items) {
        const result = schema.items;
        if (Array.isArray(result)) {
            throw Error("Array in items isn't supported");
        }

        return {...schema, items: merge(result)};
    }

    const value = removeInternalProperty(schema);

    if (value.oneOf?.length && value.allOf?.length) {
        throw Error("Object can't have both allOf and oneOf");
    }

    const combiners = value.oneOf || value.allOf || [];

    if (combiners.length === 0) {
        return {...value};
    }

    if (needToSaveRef && combiners.length === 1) {
        const inner = combiners[0];
        const merged = merge(inner);
        const description = [
            value.description,
            (inner as OpenJSONSchema).description,
            merged.description,
        ].find(Boolean);

        merged.description = description;

        return merged;
    }

    if (value.oneOf?.length) {
        const description = descriptionForOneOfElement(value);

        return {...value, description, _emptyDescription: true};
    }

    let description = value.description || '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const properties: Record<string, any> = value.properties || {};
    const required: string[] = value.required || [];

    for (const element of value.allOf || []) {
        if (typeof element === 'boolean') {
            throw Error("Boolean in allOf isn't supported");
        }

        if (element.description?.length) {
            description = concatNewLine(description, element.description);
        }

        const mergedElement = merge(element);

        for (const [k, v] of Object.entries(mergedElement?.properties ?? {})) {
            properties[k] = v;
        }

        required.push(...(element.required || []));
    }

    return {
        type: 'object',
        description,
        properties,
        required,
        allOf: value.allOf,
        oneOf: value.oneOf,
    };
}

function removeInternalProperty(schema: OpenJSONSchema): OpenJSONSchema {
    const internalPropertyTag = 'x-hidden';

    Object.keys(schema.properties || {}).forEach((key) => {
        if (schema.properties?.[key][internalPropertyTag]) {
            delete schema.properties[key];
        }
    });

    return schema;
}

function get(ref: string): OpenJSONSchema | undefined {
    return _refs[ref];
}

function has(name: string): boolean {
    return typeof _refs[name] !== 'undefined';
}

/*
 * To add runtime objects like anonymous oneOf
 */
function runtime(ref: string, value: OpenJSONSchema) {
    if (!allowRuntime) {
        return;
    }

    value._runtime = true;
    _refs[ref] = value;
}

function isRuntimeAllowed() {
    return allowRuntime;
}

function refs() {
    return _refs;
}

export default {
    init,
    find,
    get,
    has,
    runtime,
    refs,
    merge,
    isRuntimeAllowed,
};
