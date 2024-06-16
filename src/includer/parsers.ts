/* eslint-disable no-shadow */
import slugify from 'slugify';
import {getStatusText} from 'http-status-codes';

import {TAG_ID_FIELD, TAG_NAMES_FIELD} from './constants';

import {
    Endpoint,
    Endpoints,
    Info,
    Method,
    OpenAPIOperation,
    OpenAPISpec,
    Response,
    Responses,
    Server,
    Specification,
    Tag,
} from './models';

function info(spec: OpenAPISpec): Info {
    const {
        info: {title, description, version, termsOfService, license, contact},
    } = spec;

    const parsed: Info = {
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
            name: contact.name,
            sources: [],
        };
        if (contact.url) {
            parsed.contact.sources.push({type: 'web', url: new URL(contact.url).href});
        }

        if (contact.email) {
            parsed.contact.sources.push({
                type: 'email',
                url: new URL('mailto:' + contact.email).href,
            });
        }
    }

    return parsed;
}

function tagsFromSpec(spec: OpenAPISpec): Map<string, Tag> {
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

        parsed.set(id, {...tag, id, endpoints: [] as Endpoints});
    }

    type VisiterOutput = {tags: string[]; titles: string[]};

    const visiter = (params: VisiterParams): VisiterOutput | null => {
        const {endpoint} = params;

        const endpointTags = endpoint.tags;
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

    parsed.forEach((tag: Tag) => {
        tag.name = tag[TAG_NAMES_FIELD] || tag.name;
        tag.id = tag[TAG_ID_FIELD] ?? tag.id;
    });

    return parsed;
}
const opid = (path: string, method: string, id?: string) => slugify(id ?? [path, method].join('-'));

function pathsFromSpec(spec: OpenAPISpec, tagsByID: Map<string, Tag>): Specification {
    const endpoints: Endpoints = [];
    const {paths, servers, components = {}, security: globalSecurity = []} = spec;
    const visiter = ({path, method, endpoint}: VisiterParams) => {
        const {
            summary,
            description,
            tags = [],
            operationId,
            parameters,
            responses,
            requestBody,
            security = [],
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
            (server: Server) => {
                server.url = trimSlash(server.url);

                return server;
            },
        );

        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        const parseResponse = ([code, response]: [string, {[key: string]: any}]) => {
            const parsed: Partial<Response> = {code, description: response.description};

            try {
                parsed.statusText = getStatusText(code);
            } catch (err) {
                parsed.statusText = '';
            }

            if (response.content) {
                /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                parsed.schemas = Object.entries<{[key: string]: any}>(response.content).map(
                    ([type, schema]) => ({type, schema: schema?.schema || {}}),
                );
            }

            return parsed as Response;
        };

        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        const parsedResponses: Responses = Object.entries<{[key: string]: any}>(
            responses ?? {},
        ).map(parseResponse);

        const contentType = requestBody ? Object.keys(requestBody.content)[0] : undefined;

        const parsedEndpoint: Endpoint = {
            servers: parsedServers,
            responses: parsedResponses,
            parameters,
            summary,
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
                          schema: requestBody.content[contentType].schema,
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

type VisiterParams = {path: string; method: Method; endpoint: OpenAPIOperation};

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
function visitPaths<T>(paths: {[key: string]: any}, visiter: (params: VisiterParams) => T): T[] {
    const results: T[] = [];

    for (const path of Object.keys(paths)) {
        const methods = paths[path];

        for (const method of Object.keys(methods)) {
            const endpoint = methods[method];

            results.push(visiter({path, method: method as Method, endpoint}));
        }
    }

    return results;
}

export {info, tagsFromSpec as tags, pathsFromSpec as paths};

export default {info, tags: tagsFromSpec, paths: pathsFromSpec};
