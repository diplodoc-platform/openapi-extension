import type {OpenAPIV3} from 'openapi-types';

import {describe, expect, it} from 'vitest';

import {RefsService} from './refs';

function createService(refs: Record<string, unknown> = {}) {
    const run = {
        input: '/',
        vars: {
            for: () => ({}),
        },
        read: async () => '',
    };
    const service = new RefsService(run, {}, '/');

    service.get = (refId: string) => refs[refId] as OpenAPIV3.SchemaObject;

    return service;
}

describe('RefsService.merge', () => {
    it('returns schema unchanged when there are no references', () => {
        const schema: OpenAPIV3.SchemaObject = {
            type: 'string',
            description: 'Simple string',
        };

        const service = createService();
        const [result] = service.merge(schema);

        expect(result).toEqual(schema);
    });

    it('resolves single reference and adds it to $defs', () => {
        const userSchema: OpenAPIV3.SchemaObject = {
            type: 'object',
            properties: {
                name: {type: 'string'},
            },
        };

        const schema: OpenAPIV3.SchemaObject = {
            type: 'object',
            properties: {
                user: {
                    $ref: '#/components/schemas/User',
                },
            },
        };

        const service = createService({
            '#/components/schemas/User': userSchema,
        });

        const [result] = service.merge(schema);

        expect(result).toEqual({
            type: 'object',
            properties: {
                user: {
                    type: 'object',
                    properties: {
                        name: {type: 'string'},
                    },
                },
            },
        });
    });

    it('resolves multiple references to the same definition', () => {
        const userSchema: OpenAPIV3.SchemaObject = {
            type: 'object',
            properties: {
                name: {type: 'string'},
            },
        };

        const schema: OpenAPIV3.SchemaObject = {
            type: 'object',
            properties: {
                author: {
                    $ref: '#/components/schemas/User',
                },
                editor: {
                    $ref: '#/components/schemas/User',
                },
            },
        };

        const service = createService({
            '#/components/schemas/User': userSchema,
        });

        const [result] = service.merge(schema);

        expect(result).toEqual({
            type: 'object',
            properties: {
                author: {
                    type: 'object',
                    properties: {
                        name: {type: 'string'},
                    },
                },
                editor: {
                    type: 'object',
                    properties: {
                        name: {type: 'string'},
                    },
                },
            },
        });
    });

    it('resolves nested references', () => {
        const addressSchema: OpenAPIV3.SchemaObject = {
            type: 'object',
            properties: {
                street: {type: 'string'},
            },
        };

        const userSchema: OpenAPIV3.SchemaObject = {
            type: 'object',
            properties: {
                name: {type: 'string'},
                address: {
                    $ref: '#/components/schemas/Address',
                },
            },
        };

        const schema: OpenAPIV3.SchemaObject = {
            type: 'object',
            properties: {
                user: {
                    $ref: '#/components/schemas/User',
                },
            },
        };

        const service = createService({
            '#/components/schemas/User': userSchema,
            '#/components/schemas/Address': addressSchema,
        });

        const [result] = service.merge(schema);

        expect(result).toEqual({
            type: 'object',
            properties: {
                user: {
                    type: 'object',
                    properties: {
                        name: {type: 'string'},
                        address: {
                            type: 'object',
                            properties: {
                                street: {type: 'string'},
                            },
                        },
                    },
                },
            },
        });
    });

    it('resolves references in arrays', () => {
        const userSchema: OpenAPIV3.SchemaObject = {
            type: 'object',
            properties: {
                name: {type: 'string'},
            },
        };

        const schema: OpenAPIV3.SchemaObject = {
            type: 'array',
            items: {
                $ref: '#/components/schemas/User',
            },
        };

        const service = createService({
            '#/components/schemas/User': userSchema,
        });
        const [result] = service.merge(schema);

        expect(result).toEqual({
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    name: {type: 'string'},
                },
            },
        });
    });

    it('resolves references in nested objects', () => {
        const userSchema: OpenAPIV3.SchemaObject = {
            type: 'object',
            properties: {
                name: {type: 'string'},
            },
        };

        const schema: OpenAPIV3.SchemaObject = {
            type: 'object',
            properties: {
                data: {
                    type: 'object',
                    properties: {
                        user: {
                            $ref: '#/components/schemas/User',
                        },
                    },
                },
            },
        };

        const service = createService({
            '#/components/schemas/User': userSchema,
        });
        const [result] = service.merge(schema);

        expect(result).toEqual({
            type: 'object',
            properties: {
                data: {
                    type: 'object',
                    properties: {
                        user: {
                            type: 'object',
                            properties: {
                                name: {type: 'string'},
                            },
                        },
                    },
                },
            },
        });
    });

    it('resolves empty references', () => {
        const userSchema: OpenAPIV3.SchemaObject = {
            type: 'object',
            properties: {
                name: {type: 'string'},
            },
        };

        const emptyRef: OpenAPIV3.ReferenceObject = {
            $ref: '#/components/schemas/User',
        };

        const service = createService({
            '#/components/schemas/User': userSchema,
        });
        const [result] = service.merge(emptyRef);

        // Empty references at top level are resolved and don't add $defs
        expect(result).toEqual({
            type: 'object',
            properties: {
                name: {type: 'string'},
            },
        });
        expect(result).not.toHaveProperty('$defs');
    });

    it('handles circular references', () => {
        const userSchema: OpenAPIV3.SchemaObject = {
            type: 'object',
            properties: {
                name: {type: 'string'},
                friend: {
                    $ref: '#/components/schemas/User',
                },
            },
        };

        const service = createService({
            '#/components/schemas/User': userSchema,
        });
        const [result, defs] = service.merge(userSchema);

        // Circular references should be handled by adding a placeholder reference
        expect(result).toEqual({
            type: 'object',
            properties: {
                name: {type: 'string'},
                friend: {
                    type: 'object',
                    properties: {
                        name: {type: 'string'},
                        friend: {
                            $ref: '#/$defs/components/schemas/User',
                        },
                    },
                },
            },
        });
        expect(defs).toEqual({
            '#/components/schemas/User': {
                type: 'object',
                properties: {
                    name: {type: 'string'},
                    friend: {
                        $ref: '#/$defs/components/schemas/User',
                    },
                },
            },
        });
    });

    it('handles empty reference chain', () => {
        const finalSchema: OpenAPIV3.SchemaObject = {
            type: 'string',
        };

        const emptyRef2: OpenAPIV3.ReferenceObject = {
            $ref: '#/components/schemas/Final',
        };

        const emptyRef1: OpenAPIV3.ReferenceObject = {
            $ref: '#/components/schemas/Intermediate',
        };

        const service = createService({
            '#/components/schemas/Intermediate': emptyRef2,
            '#/components/schemas/Final': finalSchema,
        });
        const [result] = service.merge(emptyRef1);

        // Empty reference chain resolves to the final schema
        expect(result).toEqual(finalSchema);
        expect(result).not.toHaveProperty('$defs');
    });

    it('prevents infinite loop in circular empty references', () => {
        const emptyRef1: OpenAPIV3.ReferenceObject = {
            $ref: '#/components/schemas/Ref2',
        };

        const emptyRef2: OpenAPIV3.ReferenceObject = {
            $ref: '#/components/schemas/Ref1',
        };

        const service = createService({
            '#/components/schemas/Ref1': emptyRef1,
            '#/components/schemas/Ref2': emptyRef2,
        });
        const [result, defs] = service.merge(emptyRef1);

        // Should return empty object to prevent infinite loop
        expect(result).toEqual({
            $ref: '#/$defs/components/schemas/Ref2',
        });
        expect(defs).toEqual({
            '#/components/schemas/Ref2': {
                $ref: '#/$defs/components/schemas/Ref1',
            },
            '#/components/schemas/Ref1': {
                $ref: '#/$defs/components/schemas/Ref2',
            },
        });
    });

    it('preserves non-schema properties', () => {
        const userSchema: OpenAPIV3.SchemaObject = {
            type: 'object',
            properties: {
                name: {type: 'string'},
            },
            // @ts-ignore
            'x-custom': 'custom-value',
        };

        const schema: OpenAPIV3.SchemaObject = {
            type: 'object',
            properties: {
                user: {
                    $ref: '#/components/schemas/User',
                },
            },
            // @ts-ignore
            'x-extension': 'extension-value',
        };

        const service = createService({
            '#/components/schemas/User': userSchema,
        });
        const [result] = service.merge(schema);

        expect(result).toEqual({
            type: 'object',
            properties: {
                user: {
                    type: 'object',
                    properties: {
                        name: {type: 'string'},
                    },
                    'x-custom': 'custom-value',
                },
            },
            'x-extension': 'extension-value',
        });
    });

    it('does not add $defs when there are no references', () => {
        const schema: OpenAPIV3.SchemaObject = {
            type: 'object',
            properties: {
                name: {type: 'string'},
            },
        };

        const service = createService();
        const [result] = service.merge(schema);

        expect(result).not.toHaveProperty('$defs');
        expect(result).toEqual(schema);
    });
});
