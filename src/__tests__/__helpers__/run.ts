import {OpenAPIV3} from 'openapi-types';
import {includerFunction} from '../../includer';
import {when} from 'jest-when';
import {dump} from 'js-yaml';
import {virtualFS} from './virtualFS';
import nodeFS from 'fs';

const baseDocument = {
    openapi: '3.0.2',
    info: {
        title: 'OpenAPI definition',
        version: 'v0',
    },
    servers: [
        {
            url: 'http://localhost:8080',
            description: 'Generated server url',
        },
    ],
};

type WithDescription<T> = T & {
    description?: string;
};

type Schema = WithDescription<OpenAPIV3.MediaTypeObject>;

export class DocumentBuilder {
    static ref(target: string, description?: string): WithDescription<OpenAPIV3.ReferenceObject> {
        return {
            $ref: `#/components/schemas/${target}`,
            description,
        };
    }

    private id: string;
    private responses: [code: number, response: OpenAPIV3.ResponseObject][] = [];
    private parameters: OpenAPIV3.ParameterObject[] = [];
    private components: Record<string, OpenAPIV3.SchemaObject> = {};
    private requestBody?: OpenAPIV3.RequestBodyObject = undefined;

    constructor(id: string) {
        this.id = id;
    }

    response(code: number, skeleton: Schema) {
        const {description, ...schema} = skeleton;
        const response: OpenAPIV3.ResponseObject = {
            description: description || '',
            content: {
                'application/json': schema,
            },
        };

        this.responses.push([code, response]);

        return this;
    }

    request(skeleton: Schema) {
        if (this.requestBody) {
            throw new Error("Test case error: request can't have several requests");
        }
        const {description, ...schema} = skeleton;
        const request: OpenAPIV3.RequestBodyObject = {
            description: description,
            content: {
                'application/json': schema,
            },
        };

        this.requestBody = request;

        return this;
    }

    parameter(parameter: OpenAPIV3.ParameterObject) {
        this.parameters.push(parameter);

        return this;
    }

    component(name: string, schema: OpenAPIV3.SchemaObject) {
        this.components[name] = schema;

        return this;
    }

    build(): string {
        if (!this.responses.length) {
            throw new Error("Test case error: endpoint can't have no responses");
        }

        const spec: OpenAPIV3.Document = {
            ...baseDocument,
            paths: {
                '/test': {
                    post: {
                        requestBody: this.requestBody,
                        operationId: this.id,
                        responses: Object.fromEntries(this.responses),
                        parameters: this.parameters,
                    },
                },
            },
            components: {
                schemas: this.components,
            },
        };

        return dump(spec);
    }
}

export async function run(spec: string) {
    const id = Date.now().toString();
    const fs = virtualFS();

    when(jest.spyOn(nodeFS, 'readFile')).mockImplementation((_, callback) => {
        callback(null, Buffer.from(spec, 'utf-8'));
    });

    when(jest.spyOn(nodeFS.promises, 'writeFile')).mockImplementation(async (file, content) => {
        fs.writeFile(file.toString(), content);
    });

    when(jest.spyOn(nodeFS.promises, 'mkdir')).mockImplementation(async () => undefined);

    await includerFunction({
        index: 0,
        readBasePath: '',
        writeBasePath: '',
        vars: {},
        passedParams: {
            input: id,
        },
        tocPath: 'toc',
        item: {
            name: id,
            href: '',
            include: {
                path: 'openapi',
                repo: '__tests__',
            },
            items: [],
        },
    });

    jest.clearAllMocks();

    return fs;
}
