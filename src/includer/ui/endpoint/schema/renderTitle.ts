import type {JSONSchema, RenderContext} from './jsonSchema';

import {decorate, traverseSchemaRefs} from './utils';

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

    const skipTitle = !title || isObjectSchema || suppressTitle;

    if (skipTitle) {
        return '';
    }

    return `**${title}**`;
}

export function renderDeprecated(schema: JSONSchema, context: RenderContext): string {
    if (context.suppressDeprecatedWarning) {
        return '';
    }

    if (schema.deprecated !== true) {
        return '';
    }

    const {deprecated} = context.i18n;
    const title = decorate(deprecated.title, 'json-schema-deprecated-title');

    return `${title}{title="${deprecated.message}"}`;
}
