import type {OpenJSONSchema, OpenJSONSchemaDefinition, Refs} from '../models';

import {extractOneOfElements} from '../traverse/types';
import {concatNewLine, copy, source} from '../utils';
import {anchor} from '../ui';

function removeInternalProperty(schema: OpenJSONSchema): OpenJSONSchema {
    const properties = copy(schema.properties || {});

    Object.keys(properties).forEach((key) => {
        if (properties[key]['x-hidden']) {
            delete properties[key];
        }
    });

    return {...copy(schema), properties};
}

export class RefsService {
    private _refs: Refs = {};

    get refs() {
        return this._refs;
    }

    add(key: string, value: OpenJSONSchema) {
        this._refs[key] = value;
    }

    get(key: string) {
        return this._refs[key];
    }

    /**
     * Find dereferenced object from schema in all components/schemas
     * @param value target spec
     * @returns refference of target or undefiend
     */
    find(value: OpenJSONSchema): string | undefined {
        for (const [k, v] of Object.entries(this._refs)) {
            // @apidevtools/swagger-parser guaranties, that in refs list there will be the same objects
            // but same objects can have different descriptions
            for (const field of [
                'properties',
                'additionalProperties',
                'allOf',
                'oneOf',
                'enum',
            ] as const) {
                // @ts-ignore
                if (v[field] && v[field] === source(value[field])) {
                    return k;
                }
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
    merge(schema: OpenJSONSchemaDefinition, needToSaveRef = true): OpenJSONSchema {
        if (typeof schema === 'boolean') {
            throw Error("Boolean value isn't supported");
        }

        if (schema.items) {
            const result = schema.items;
            if (Array.isArray(result)) {
                throw Error("Array in items isn't supported");
            }

            return {...schema, items: this.merge(result)};
        }

        const value = removeInternalProperty(schema);

        if (value.oneOf?.length && value.allOf?.length) {
            throw Error("Object can't have both allOf and oneOf");
        }

        const combiners = value.oneOf || value.allOf || [];

        if (combiners.length === 0) {
            return copy(value);
        }

        if (needToSaveRef && combiners.length === 1) {
            const inner = combiners[0];
            const merged = this.merge(inner);
            const description = [
                value.description,
                (inner as OpenJSONSchema).description,
                merged.description,
            ].find(Boolean);

            merged.description = description;

            return merged;
        }

        if (value.oneOf?.length) {
            const description = this.descriptionForOneOfElement(value);

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

            const mergedElement = this.merge(element);

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

    private anchorToSchema(item: OpenJSONSchema): string | undefined {
        const ref = this.find(item);

        return ref ? anchor(ref) : undefined;
    }

    private descriptionForOneOfElement(target: OpenJSONSchema, withTypes?: boolean): string {
        let description = target.description || '';

        const elements = extractOneOfElements(target);

        if (elements.length === 0) {
            return description;
        }

        if (withTypes) {
            if (description.length) {
                description += '\n';
            }

            description += extractOneOfElements(target)
                .map((item) => this.anchorToSchema(item))
                .filter(Boolean)
                .join(' \nor ');
        }

        return description;
    }
}
