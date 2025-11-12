import type {Context} from '../../index';
import type {V3Endpoint} from '../../models';

import {INFO_TAB_NAME, SANDBOX_TAB_NAME} from '../../constants';
import {block, deprecated, meta, nolint, openapi, tabs, terms, title} from '../common';

import {Renderer} from './renderer';

export type RenderMode = 'read' | 'write';

export function endpoint(
    data: V3Endpoint,
    sandboxPlugin: {host?: string; tabName?: string} | undefined,
    ctx: Context,
) {
    const render = new Renderer(ctx);

    const contentWrapper = (content: string) => {
        if (!sandboxPlugin) {
            return content;
        }

        return tabs({
            [INFO_TAB_NAME]: content,
            [sandboxPlugin?.tabName ?? SANDBOX_TAB_NAME]: render.sandbox({
                params: data.parameters,
                host: sandboxPlugin?.host,
                path: data.path,
                security: data.security,
                requestBody: data.requestBody,
                method: data.method,
            }),
        });
    };

    const endpointPage = block([
        title(1)(data.summary ?? data.id),
        data.deprecated && deprecated(),
        contentWrapper(block([data.description, render.request(data), render.responses(data)])),
    ]);

    return block([
        meta([data.noindex && 'noIndex: true']),
        nolint(),
        openapi(endpointPage),
        terms(['Deprecated']),
    ]).trim();
}
