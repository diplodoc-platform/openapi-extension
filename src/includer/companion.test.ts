import type {OpenAPIV3} from 'openapi-types';
import type {Specification, V3Endpoint, V3Tag} from './models';

import {describe, expect, it} from 'vitest';

import {buildCompanionDocument, serializeCompanionDocument, stripXHidden} from './companion';

function endpoint(method: string, path: string): V3Endpoint {
    return {
        id: `${method}-${path}`,
        method,
        path: path.replace(/^\/+/, ''),
        tags: [],
        servers: [],
        parameters: [],
        responses: [],
        security: [],
    };
}

function spec(endpoints: V3Endpoint[], tags: Map<string, V3Tag> = new Map()): Specification {
    return {tags, endpoints};
}

describe('stripXHidden', () => {
    it('removes object properties whose value is marked x-hidden', () => {
        const result = stripXHidden({
            visible: {type: 'string'},
            secret: {type: 'string', 'x-hidden': true},
        });

        expect(result).toEqual({visible: {type: 'string'}});
    });

    it('filters out hidden items from arrays (e.g. parameters)', () => {
        const result = stripXHidden([{name: 'a'}, {name: 'b', 'x-hidden': true}, {name: 'c'}]);

        expect(result).toEqual([{name: 'a'}, {name: 'c'}]);
    });

    it('strips the x-hidden annotation key itself', () => {
        const result = stripXHidden({type: 'object', 'x-hidden': false});

        expect(result).toEqual({type: 'object'});
    });

    it('recurses into nested structures', () => {
        const result = stripXHidden({
            schema: {
                properties: {
                    keep: {type: 'number'},
                    drop: {type: 'number', 'x-hidden': true},
                },
            },
        });

        expect(result).toEqual({schema: {properties: {keep: {type: 'number'}}}});
    });
});

describe('serializeCompanionDocument', () => {
    it('produces minified JSON without insignificant whitespace', () => {
        const json = serializeCompanionDocument({
            openapi: '3.0.0',
            info: {title: 't', version: '1'},
            paths: {},
        } as OpenAPIV3.Document);

        expect(json).not.toMatch(/\n/);
        expect(json).not.toMatch(/": /);
        expect(JSON.parse(json)).toMatchObject({openapi: '3.0.0'});
    });
});

describe('buildCompanionDocument', () => {
    const baseDocument = (): OpenAPIV3.Document => ({
        openapi: '3.0.0',
        info: {title: 'T', version: '1'},
        paths: {
            '/a': {get: {responses: {'200': {description: 'ok'}}}},
            '/b': {get: {responses: {'200': {description: 'ok'}}}},
        },
        components: {
            schemas: {
                Used: {type: 'object', properties: {id: {type: 'string'}}},
                Unused: {type: 'object'},
            },
            securitySchemes: {
                apiKey: {type: 'apiKey', name: 'key', in: 'header'},
            },
        },
    });

    it('keeps only the operations present in the specification', () => {
        const document = baseDocument();
        const result = buildCompanionDocument(document, spec([endpoint('get', '/a')]));

        expect(Object.keys(result.paths)).toEqual(['/a']);
        expect(result.paths['/b']).toBeUndefined();
    });

    it('prunes schemas that become unreachable', () => {
        const document = baseDocument();
        document.paths['/a'] = {
            get: {
                responses: {
                    '200': {
                        description: 'ok',
                        content: {
                            'application/json': {
                                schema: {$ref: '#/components/schemas/Used'},
                            },
                        },
                    },
                },
            },
        };

        const result = buildCompanionDocument(document, spec([endpoint('get', '/a')]));
        const schemas = result.components?.schemas ?? {};

        expect(schemas.Used).toBeDefined();
        expect(schemas.Unused).toBeUndefined();
    });

    it('keeps non-schema component groups (e.g. securitySchemes) intact', () => {
        const document = baseDocument();
        const result = buildCompanionDocument(document, spec([endpoint('get', '/a')]));

        expect(result.components?.securitySchemes?.apiKey).toBeDefined();
    });

    it('removes x-hidden fields from the emitted spec', () => {
        const document = baseDocument();
        document.components = {
            ...document.components,
            schemas: {
                ...document.components?.schemas,
                Used: {
                    type: 'object',
                    properties: {
                        id: {type: 'string'},
                        secret: {type: 'string', 'x-hidden': true} as OpenAPIV3.SchemaObject,
                    },
                },
            },
        };
        document.paths['/a'] = {
            get: {
                responses: {
                    '200': {
                        description: 'ok',
                        content: {
                            'application/json': {schema: {$ref: '#/components/schemas/Used'}},
                        },
                    },
                },
            },
        };

        const result = buildCompanionDocument(document, spec([endpoint('get', '/a')]));
        const used = result.components?.schemas?.Used as OpenAPIV3.SchemaObject;

        expect(used.properties?.id).toBeDefined();
        expect(used.properties?.secret).toBeUndefined();
        expect(serializeCompanionDocument(result)).not.toContain('x-hidden');
    });

    it('does not mutate the source paths object', () => {
        const document = baseDocument();
        buildCompanionDocument(document, spec([endpoint('get', '/a')]));

        expect(Object.keys(document.paths)).toEqual(['/a', '/b']);
    });
});

describe('buildCompanionDocument (OpenAPI 3.1.0)', () => {
    // 3.1.0 specifics: `type` may be an array (e.g. nullable via `['string', 'null']`),
    // `examples` is keyed, and JSON-Schema dialect keywords are allowed in schemas.
    const document31 = (): OpenAPIV3.Document =>
        ({
            openapi: '3.1.0',
            info: {title: 'T', version: '1', summary: 'short'},
            paths: {
                '/a': {
                    get: {
                        responses: {
                            '200': {
                                description: 'ok',
                                content: {
                                    'application/json': {
                                        schema: {$ref: '#/components/schemas/Used'},
                                    },
                                },
                            },
                        },
                    },
                },
                '/b': {get: {responses: {'200': {description: 'ok'}}}},
            },
            components: {
                schemas: {
                    Used: {
                        type: 'object',
                        properties: {
                            id: {type: ['string', 'null']},
                            nested: {$ref: '#/components/schemas/Nested'},
                            secret: {type: 'string', 'x-hidden': true},
                        },
                    },
                    Nested: {type: 'object', properties: {ok: {type: 'boolean'}}},
                    Unused: {type: 'object'},
                },
            },
        }) as unknown as OpenAPIV3.Document;

    it('preserves array-form `type` and transitive refs while pruning unused schemas', () => {
        const result = buildCompanionDocument(document31(), spec([endpoint('get', '/a')]));
        const schemas = result.components?.schemas ?? {};

        expect(result.openapi).toBe('3.1.0');
        expect(Object.keys(result.paths)).toEqual(['/a']);
        expect(schemas.Used).toBeDefined();
        expect(schemas.Nested).toBeDefined();
        expect(schemas.Unused).toBeUndefined();

        const used = schemas.Used as OpenAPIV3.SchemaObject;
        expect((used.properties?.id as {type: unknown}).type).toEqual(['string', 'null']);
    });

    it('removes x-hidden fields from a 3.1.0 spec', () => {
        const result = buildCompanionDocument(document31(), spec([endpoint('get', '/a')]));
        const used = result.components?.schemas?.Used as OpenAPIV3.SchemaObject;

        expect(used.properties?.id).toBeDefined();
        expect(used.properties?.secret).toBeUndefined();
        expect(serializeCompanionDocument(result)).not.toContain('x-hidden');
    });
});
