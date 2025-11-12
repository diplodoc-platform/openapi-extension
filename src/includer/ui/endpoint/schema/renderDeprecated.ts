import type {JSONSchema, RenderContext} from './jsonSchema';

import {decorate} from './utils';

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
