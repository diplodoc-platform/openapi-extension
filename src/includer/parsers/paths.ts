import type {OpenAPIV3} from 'openapi-types';
import type {Dereference, Specification} from '../models';
import type {V3Tag} from './tags';

import {getReasonPhrase} from 'http-status-codes';
import slugify from 'slugify';

import {visitPaths} from './utils';

export type V3Response = {
    // response code validation omitted
    code: string;
    statusText: string;
    description: string;
    schemas?: V3Schema[];
    deprecated?: boolean;
};

export type V3Schema = {
    type: string;
    schema: OpenAPIV3.SchemaObject;
};

export type V3Endpoint = {
    id: string;
    operationId?: string;
    method: string;
    path: string;
    tags: string[];
    summary?: string;
    description?: string;
    servers: OpenAPIV3.ServerObject[];
    parameters: Dereference<OpenAPIV3.ParameterObject>[];
    responses: V3Response[];
    requestBody?: V3Schema;
    security: OpenAPIV3.SecuritySchemeObject[];
    noindex?: boolean;
    hidden?: boolean;
    deprecated?: boolean;
};

const opid = (path: string, method: string, id?: string) => slugify(id ?? [path, method].join('-'));

export function paths(
    spec: Dereference<OpenAPIV3.Document>,
    tagsByID: Map<string, V3Tag>,
): Specification {
    const endpoints: V3Endpoint[] = [];
    const {paths, servers, components = {}, security: globalSecurity = []} = spec;
    const {securitySchemes = {}} = components;

    visitPaths(paths, ({path, method, endpoint}) => {
        const {
            summary,
            description,
            tags = [],
            operationId,
            parameters,
            responses,
            requestBody,
            security = [],
            deprecated,
        } = endpoint;

        const parsedSecurity = [...security, ...globalSecurity].reduce((arr, item) => {
            const schemas = Object.keys(item)
                .map((key) => securitySchemes[key])
                .filter(Boolean);
            return arr.concat(schemas);
        }, [] as OpenAPIV3.SecuritySchemeObject[]);

        const parsedServers = (endpoint.servers || servers || [{url: '/'}]).map(parseServer);

        const parsedResponses: V3Response[] = Object.entries(responses ?? {}).map(parseResponse);

        const parsedEndpoint: V3Endpoint = {
            servers: parsedServers,
            responses: parsedResponses,
            parameters: parameters || [],
            summary,
            deprecated,
            description,
            path: trimSlash(path),
            method,
            operationId,
            tags: tags.map((tag) => slugify(tag)),
            id: opid(path, method, operationId),
            requestBody: parseRequestBody(requestBody),
            security: parsedSecurity,
        };

        for (const name of tags) {
            const id = slugify(name);
            const tag = tagsByID.get(id) || {name, id, endpoints: []};

            tag.endpoints.push(parsedEndpoint);

            tagsByID.set(id, tag);
        }

        if (!tags.length) {
            endpoints.push(parsedEndpoint);
        }
    });

    return {tags: tagsByID, endpoints};
}

function parseRequestBody(
    requestBody: OpenAPIV3.RequestBodyObject | undefined,
): V3Schema | undefined {
    if (!requestBody) {
        return undefined;
    }

    const contentType = Object.keys(requestBody.content)[0];
    if (!contentType) {
        return undefined;
    }

    return {
        type: contentType,
        schema: (requestBody as OpenAPIV3.RequestBodyObject).content[contentType]
            .schema as OpenAPIV3.SchemaObject,
    };
}

function parseServer(server: OpenAPIV3.ServerObject): OpenAPIV3.ServerObject {
    server.url = trimSlash(server.url);

    return server;
}

function parseResponse([code, response]: [
    string,
    Dereference<OpenAPIV3.ResponseObject>,
]): V3Response {
    const parsed: V3Response = {
        code,
        description: response.description,
        statusText: '',
    };

    try {
        parsed.statusText = getReasonPhrase(code);
    } catch {}

    if (response.content) {
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        parsed.schemas = Object.entries<{[key: string]: any}>(response.content).map(
            ([type, schema]) => ({type, schema: schema?.schema || {}}),
        );
    }

    if (parsed.schemas?.length && parsed.schemas?.every(({schema}) => schema.deprecated)) {
        parsed.deprecated = true;
    }

    return parsed;
}

function trimSlash(str: string) {
    return str.replace(/^\/|\/$/g, '');
}
