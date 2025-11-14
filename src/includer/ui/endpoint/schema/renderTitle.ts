import type {JSONSchema, RenderContext} from './jsonSchema';

import {traverseSchemaRefs} from './utils';

export function renderTitle(schema: JSONSchema, context: RenderContext): string {
    const {suppressTitle} = context;

    let title: string | undefined;

    const isObjectSchema =
        schema.type === 'object' &&
        (schema.properties || schema.additionalProperties || schema.patternProperties);

    traverseSchemaRefs(schema, context.ref, (current) => {
        if (title === undefined && current.title) {
            title = current.title;
        }
    });

    if (!title || isObjectSchema || suppressTitle) {
        return '';
    }

    return `**${title}**`;
}
