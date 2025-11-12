import type {V3Schema} from '../../../models';
import type {Renderer} from '../renderer';

import {block, bold, cut, title} from '../../common';
import {isPrimitiveType} from '../utils';

export function renderBody(render: Renderer, obj: V3Schema | undefined, mode: 'read' | 'write') {
    if (!obj) {
        return '';
    }

    const {type = 'schema', schema} = obj;
    const sectionTitle = title(3)('Body');

    if (isPrimitiveType(schema)) {
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
        cut(render.example(schema, mode) as string, type),
        render.table(schema, mode),
        '</div>',
        ...render.refs(mode),
    ];

    return block(result);
}
