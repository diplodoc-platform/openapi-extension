import type {OpenAPIV3} from 'openapi-types';
import type {V3Schema} from '../../../models';
import type {Renderer} from '../renderer';

import {block, bold, title} from '../../common';
import {PRIMITIVE_JSON6_SCHEMA_TYPES} from '../../../constants';

function isPrimitive(type: OpenAPIV3.SchemaObject['type']) {
    return PRIMITIVE_JSON6_SCHEMA_TYPES.has(type);
}

export function renderBody(render: Renderer, obj: V3Schema | undefined) {
    if (!obj) {
        return '';
    }

    const {type = 'schema', schema} = obj;
    const sectionTitle = title(3)('Body');

    if (isPrimitive(schema.type)) {
        return block([
            sectionTitle,
            type,
            `${bold('Type:')} ${schema.type}`,
            schema.format ? `${bold('Format:')} ${schema.format}` : null,
            schema.description ? `${bold('Description:')} ${schema.description}` : null,
        ]);
    }

    const result = [
        '<div class="openapi-entity">',
        sectionTitle,
        // cut(code(stringify(parsedSchema, null, 4), 'json'), type),
        render.table(schema),
        '</div>',
        ...render.refs(),
    ];

    return block(result);
}
