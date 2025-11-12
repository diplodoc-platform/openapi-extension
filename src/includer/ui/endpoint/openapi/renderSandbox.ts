import type {V3Schema, V3Security} from '../../../models';
import type {OpenAPIV3} from 'openapi-types';

import {dump} from 'js-yaml';

// import { prepareSampleObject } from '../../traverse/tables';
import {block} from '../../common';

export type SandboxData = {
    params?: OpenAPIV3.ParameterObject[];
    host?: string;
    path: string;
    security: V3Security[];
    requestBody?: V3Schema;
    method: string;
};

export function renderSandbox(data: SandboxData) {
    const {params, host, path, security, requestBody, method} = data;
    const pathParams = params?.filter((param: OpenAPIV3.ParameterObject) => param.in === 'path');
    const searchParams = params?.filter((param: OpenAPIV3.ParameterObject) => param.in === 'query');
    const headers = params?.filter((param: OpenAPIV3.ParameterObject) => param.in === 'header');
    const bodyStr: null | string = null;

    // if (requestBody?.type === 'application/json' || requestBody?.type === 'multipart/form-data') {
    //     bodyStr = JSON.stringify(prepareSampleObject(requestBody?.schema ?? {}, [], ctx), null, 2);
    // }

    const props = dump({
        pathParams,
        searchParams,
        headers,
        body: bodyStr,
        schema: requestBody?.schema ?? {},
        bodyType: requestBody?.type,
        method,
        security,
        path: path,
        host: host ?? '',
    });

    return block(['```openapi-sandbox\n' + props + '\n```']);
}
