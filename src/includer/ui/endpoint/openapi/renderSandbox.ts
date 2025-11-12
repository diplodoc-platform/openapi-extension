import type {OpenAPIV3} from 'openapi-types';
import type {V3Schema} from '../../../models';
import type {Renderer} from '../renderer';

import {dump} from 'js-yaml';

import {code} from '../../common';

export type SandboxData = {
    params?: OpenAPIV3.ParameterObject[];
    host?: string;
    path: string;
    security: OpenAPIV3.SecuritySchemeObject[];
    requestBody?: V3Schema;
    method: string;
};

export function renderSandbox(render: Renderer, data: SandboxData) {
    const {params, host, path, security, requestBody, method} = data;
    const pathParams = params?.filter((param: OpenAPIV3.ParameterObject) => param.in === 'path');
    const searchParams = params?.filter((param: OpenAPIV3.ParameterObject) => param.in === 'query');
    const headers = params?.filter((param: OpenAPIV3.ParameterObject) => param.in === 'header');
    let bodyStr: null | string = null;

    if (requestBody?.type === 'application/json' || requestBody?.type === 'multipart/form-data') {
        bodyStr = JSON.stringify(render.example(requestBody.schema, 'write', false), null, 2);
    }

    const props = dump({
        pathParams,
        searchParams,
        headers,
        body: bodyStr,
        schema: render.mergeSchema(requestBody?.schema ?? {}),
        bodyType: requestBody?.type,
        method,
        security,
        path: path,
        host: host ?? '',
    });

    return code(props, 'openapi-sandbox');
}
