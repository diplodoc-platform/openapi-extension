import type {Context} from '../index';
import type {
    JSONSchemaType,
    JSONSchemaUnionType,
    JsType,
    OpenJSONSchema,
    SupportedEnumType,
} from '../models';

import stringify from 'json-stringify-safe';

import {SUPPORTED_ENUM_TYPES} from '../constants';
import {anchor} from '../ui';

function inferType(value: OpenJSONSchema, ctx: Context): JSONSchemaType {
    if (value === null) {
        return 'null';
    }

    const ref = ctx.refs.find(value);

    if (value.oneOf?.length) {
        const unionOf = (value.oneOf.filter(Boolean) as OpenJSONSchema[]).map((el) => {
            const foundRef = ctx.refs.find(el);

            if (foundRef) {
                return {ref: foundRef};
            }

            return inferType(el, ctx);
        });

        if (unionOf.length === 1) {
            return unionOf[0];
        }

        return {
            ref,
            unionOf: [...new Set(unionOf)],
        };
    }

    if (ref) {
        return {ref};
    }

    if (value.type) {
        return value.type;
    }

    if (value.enum) {
        const enumType = typeof value.enum[0];
        if (isSupportedEnumType(enumType)) {
            return enumType;
        }

        throw new Error(`Unsupported enum type in value: ${stringify(value)}`);
    }

    if (value.default) {
        const type = typeof value.default;
        if (isSupportedEnumType(type)) {
            return type;
        }
    }

    return 'any';
}

function extractRefFromType(type: JSONSchemaType): string | undefined {
    if (typeof type === 'string') {
        return undefined;
    }

    if (Array.isArray(type)) {
        return undefined;
    }

    return type.ref;
}

function collectRefs(type: JSONSchemaType): string[] {
    const result: JSONSchemaType[] = [];

    if (isUnionType(type)) {
        result.push(...(type.unionOf || []));
    } else {
        result.push(type);
    }

    return result
        .map(extractRefFromType)
        .filter((maybeRef): maybeRef is string => typeof maybeRef !== 'undefined');
}

function isUnionType(type: JSONSchemaType): type is JSONSchemaUnionType {
    if (Array.isArray(type)) {
        return false;
    }

    if (typeof type !== 'object') {
        return false;
    }

    return 'unionOf' in type && Boolean(type.unionOf?.length);
}

function typeToText(type: JSONSchemaType): string {
    if (typeof type === 'string') {
        return `${type}`;
    }

    if (Array.isArray(type)) {
        return 'array';
    }

    if (isUnionType(type)) {
        return type.unionOf.map(typeToText).join(' \nor ');
    }

    if (type.ref) {
        return anchor(type.ref);
    }

    throw new Error(`Unable to stringify type: ${type}`);
}

function isSupportedEnumType(enumType: JsType): enumType is SupportedEnumType {
    return SUPPORTED_ENUM_TYPES.some((type) => enumType === type);
}

function extractOneOfElements(from: OpenJSONSchema): OpenJSONSchema[] {
    if (!from.oneOf?.length) {
        return [];
    }

    const elements = from.oneOf.filter(Boolean) as OpenJSONSchema[];

    return elements;
}

export {
    inferType,
    typeToText,
    isSupportedEnumType,
    extractOneOfElements,
    extractRefFromType,
    collectRefs,
};
