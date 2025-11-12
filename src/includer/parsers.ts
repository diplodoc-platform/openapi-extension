import type {OpenAPIV3} from 'openapi-types';
import type {
    ContactSource,
    Dereference,
    Specification,
    V3Endpoint,
    V3Endpoints,
    V3Info,
    V3Response,
    V3Responses,
    V3Server,
    V3Tag,
} from './models';

import slugify from 'slugify';
import {getStatusText} from 'http-status-codes';

import {methods} from './models';
import {TAG_NAMES_FIELD} from './constants';

function info(spec: Dereference<OpenAPIV3.Document>): V3Info {
    const {
        info: {title, description, version, termsOfService, license, contact},
    } = spec;

    const parsed: V3Info = {
        name: title,
        version: version,
    };

    if (termsOfService) {
        parsed.terms = new URL(termsOfService).href;
    }

    if (description) {
        parsed.description = description;
    }

    if (license) {
        parsed.license = {
            name: license.name,
        };

        if (license.url) {
            parsed.license.url = new URL(license.url).href;
        }
    }

    if (contact && (contact.url || contact.email)) {
        parsed.contact = {
            name: contact.name || '',
            sources: [
                contact.url && {type: 'web', url: new URL(contact.url).href},
                contact.email && {
                    type: 'email',
                    url: new URL('mailto:' + contact.email).href,
                },
            ].filter(Boolean) as ContactSource[],
        };
    }

    return parsed;
}

function tagsFromSpec(spec: Dereference<OpenAPIV3.Document>): Map<string, V3Tag> {
    const {tags, paths} = spec;

    const parsed = new Map();

    if (!tags?.length) {
        return parsed;
    }

    for (const tag of tags) {
        if (!tag?.name?.length) {
            continue;
        }

        const id = slugify(tag.name);

        parsed.set(id, {...tag, id, endpoints: [] as V3Endpoints});
    }

    type VisiterOutput = {tags: string[]; titles: string[]};

    const visiter = (params: VisiterParams): VisiterOutput | null => {
        const {endpoint} = params;

        const endpointTags = endpoint.tags;
        // @ts-ignore
        const titles = endpoint[TAG_NAMES_FIELD];

        if (!endpointTags?.length || !titles?.length || endpointTags.length !== titles.length) {
            return null;
        }

        return {tags: endpointTags, titles};
    };

    const tagsTitles = visitPaths(paths, visiter).filter(Boolean) as VisiterOutput[];

    for (const {tags: visiterTags, titles} of tagsTitles) {
        for (let i = 0; i < titles.length; i++) {
            const key = slugify(visiterTags[i]);

            parsed.set(key, {...parsed.get(key), name: titles[i]});
        }
    }

    return parsed;
}
const opid = (path: string, method: string, id?: string) => slugify(id ?? [path, method].join('-'));

function pathsFromSpec(
    spec: Dereference<OpenAPIV3.Document>,
    tagsByID: Map<string, V3Tag>,
): Specification {
    const endpoints: V3Endpoints = [];
    const {paths, servers, components = {}, security: globalSecurity = []} = spec;
    const visiter = ({path, method, endpoint}: Dereference<VisiterParams>) => {
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
            arr.push(
                ...Object.keys(item).reduce((acc, key) => {
                    // @ts-ignore
                    acc.push(components.securitySchemes[key]);
                    return acc;
                }, []),
            );
            return arr;
        }, []);

        const parsedServers = (endpoint.servers || servers || [{url: '/'}]).map(
            (server: V3Server) => {
                server.url = trimSlash(server.url);

                return server;
            },
        );

        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        const parseResponse = ([code, response]: [
            string,
            Dereference<OpenAPIV3.ResponseObject>,
        ]) => {
            const parsed: Partial<V3Response> = {code, description: response.description};

            try {
                parsed.statusText = getStatusText(code);
            } catch {
                parsed.statusText = '';
            }

            if (response.content) {
                /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                parsed.schemas = Object.entries<{[key: string]: any}>(response.content).map(
                    ([type, schema]) => ({type, schema: schema?.schema || {}}),
                );
            }

            if (parsed.schemas?.length && parsed.schemas?.every(({schema}) => schema.deprecated)) {
                parsed.deprecated = true;
            }

            return parsed as V3Response;
        };

        const parsedResponses: V3Responses = Object.entries(responses ?? {}).map(parseResponse);

        const contentType = requestBody ? Object.keys(requestBody.content)[0] : undefined;

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
            requestBody:
                contentType && requestBody
                    ? {
                          type: contentType,
                          schema: (requestBody as OpenAPIV3.RequestBodyObject).content[contentType]
                              .schema as OpenAPIV3.SchemaObject,
                      }
                    : undefined,
            security: parsedSecurity,
        };

        for (const tag of tags) {
            const key = slugify(tag);
            const old = tagsByID.get(key) || {name: tag, id: key, endpoints: []};

            tagsByID.set(key, {
                ...old,
                endpoints: old.endpoints.concat(parsedEndpoint),
            });
        }

        if (!tags.length) {
            endpoints.push(parsedEndpoint);
        }
    };

    visitPaths(paths, visiter);

    return {tags: tagsByID, endpoints};
}

function trimSlash(str: string) {
    return str.replace(/^\/|\/$/g, '');
}

type VisiterParams = {
    path: string;
    method: string;
    endpoint: Dereference<OpenAPIV3.OperationObject>;
};

function visitPaths<T>(paths: OpenAPIV3.PathsObject, visiter: (params: VisiterParams) => T): T[] {
    const results: T[] = [];

    for (const [path, items] of Object.entries(paths)) {
        for (const method of methods) {
            const endpoint = (items as OpenAPIV3.PathItemObject)[
                method
            ] as Dereference<OpenAPIV3.OperationObject>;
            if (endpoint) {
                results.push(visiter({path, method, endpoint}));
            }
        }
    }

    return results;
}

export {info, tagsFromSpec as tags, pathsFromSpec as paths};

export default {info, tags: tagsFromSpec, paths: pathsFromSpec};
