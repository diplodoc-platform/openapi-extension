import type {Context} from '../../index';
import type {OpenApiIncluderParams, V3Endpoint} from '../../models';

import {INFO_TAB_NAME, SANDBOX_TAB_NAME} from '../../constants';
import {block, deprecated, meta, nolint, openapi, tabs, terms, title} from '../common';

import {Renderer} from './renderer';

export type RenderMode = 'read' | 'write';

function interpolateHost(host: string | undefined, vars: Context['vars']): string | undefined {
    if (!host?.includes('{{')) {
        return host;
    }

    return host.replace(/{{([^{}]+)}}/g, (placeholder, variable: string) => {
        const name = variable.trim();

        return Object.getOwnPropertyDescriptor(vars, name) === undefined ? placeholder : vars[name];
    });
}

export function endpoint(
    data: V3Endpoint,
    sandboxPlugin: OpenApiIncluderParams['sandbox'],
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
                host: interpolateHost(sandboxPlugin?.host, ctx.vars),
                customHost: sandboxPlugin?.customHost,
                path: data.path,
                security: data.security,
                requestBody: data.requestBody,
                method: data.method,
            }),
        });
    };

    const endpointPage = block([
        title(1)(data.summary ?? data.id),
        nolint(),
        data.deprecated && deprecated(),
        contentWrapper(block([data.description, render.request(data), render.responses(data)])),
    ]);

    return block([
        meta([data.noindex && 'noIndex: true']),
        openapi(endpointPage),
        terms(['Deprecated']),
    ]).trim();
}
