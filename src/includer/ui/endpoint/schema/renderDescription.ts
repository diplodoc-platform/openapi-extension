import type {JSONSchema, RenderContext} from './jsonSchema';

import {block} from '../../common';

import {traverseSchemaRefs} from './utils';

export function renderDescription(schema: JSONSchema, context: RenderContext): string {
    const descriptions: string[] = [];
    const seenValues = new Set<string>();

    const append = (value?: string) => {
        if (!value || seenValues.has(value)) {
            return;
        }

        seenValues.add(value);
        descriptions.push(value);
    };

    traverseSchemaRefs(schema, context.ref, (current) => {
        append(current.description);
    });

    return block(descriptions);
}
