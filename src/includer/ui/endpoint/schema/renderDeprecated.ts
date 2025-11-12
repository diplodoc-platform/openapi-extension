import type {JSONSchema, RenderContext} from './jsonSchema';

import {traverseSchemaRefs} from './utils';

export function renderDeprecated(schema: JSONSchema, context: RenderContext): string {
    if (context.suppressDeprecatedWarning) {
        return '';
    }

    let isDeprecated = false;

    traverseSchemaRefs(schema, context.ref, (current) => {
        if (!isDeprecated && current.deprecated === true) {
            isDeprecated = true;
        }
    });

    if (!isDeprecated) {
        return '';
    }

    const {deprecated} = context.i18n;
    return `> ⚠️ **${deprecated.title}**: ${deprecated.message}`;
}
