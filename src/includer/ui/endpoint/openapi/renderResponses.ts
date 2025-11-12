import type {V3Endpoint, V3Response} from '../../../models';
import type {Renderer} from '../renderer';

import {block, deprecated, title} from '../../common';
import {RESPONSES_SECTION_NAME} from '../../../constants';

export function renderResponses(render: Renderer, data: V3Endpoint) {
    return (
        data.responses?.length &&
        block([
            title(2)(RESPONSES_SECTION_NAME),
            ...data.responses.map((resp) => renderResponse(render, resp)),
        ])
    );
}

function renderResponse(render: Renderer, resp: V3Response) {
    let header = resp.code;

    if (resp.statusText.length) {
        header += ` ${resp.statusText}`;
    }

    return block([
        `<div class="openapi__response__code__${resp.code}">`,
        title(2)(header),
        resp.deprecated && deprecated(),
        resp.description,
        ...(resp.schemas || []).map((schema) => render.body(schema, 'read')),
        '</div>',
    ]);
}
