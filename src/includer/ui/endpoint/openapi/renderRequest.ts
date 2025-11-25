import type {V3Endpoint} from '../../../models';
import type {Renderer} from '../renderer';

import {block, method, title} from '../../common';
import {REQUEST_SECTION_NAME} from '../../../constants';

export function renderRequest(render: Renderer, data: V3Endpoint) {
    const {path, method: type, servers} = data;

    const requests = servers.map((server, index) => {
        const args = [`--method: var(--dc-openapi-methods-${type})`];

        if (index !== servers.length) {
            args.push('margin-bottom: 12px');
        }

        return block([
            `<div class="openapi__request__wrapper" style="${args.join(';')}">`,
            `<div class="openapi__request">`,
            method(type, path, server),
            '</div>',
            server.description || '',
            '</div>',
        ]);
    });

    const result = [
        title(2)(REQUEST_SECTION_NAME),
        '<div class="openapi__requests">',
        ...requests,
        '</div>',
        render.parameters(data.parameters),
        render.body(data.requestBody, 'write'),
    ];

    return block(result);
}
