import {OpenJSONSchema} from '../includer/models';

export interface Field<T = unknown, E = unknown> {
    validate(): Nullable<E>;
    value(): Nullable<T>;
}

export type FormState = {
    path: Record<string, string>;
    search: Record<string, string>;
    headers: Record<string, string>;
    bodyJson?: string;
    bodyFormData?: FormData;
};

export type ResponseState = {
    url: string;
    status: number;
    text?: string;
    file?: {
        blob: Blob;
        name: string;
    };
};

export type ErrorState = {
    message: string;
};

export type Nullable<T> = T | null | undefined;

export const titleDepths = [1, 2, 3, 4, 5, 6] as const;

export type TitleDepth = (typeof titleDepths)[number];

export type SandboxProps = {
    path: string;
    host?: string;
    method: Method;
    pathParams?: Parameters;
    searchParams?: Parameters;
    headers?: Parameters;
    body?: string;
    bodyType?: string;
    schema?: OpenJSONSchema;
    security?: Security[];
};

export type OpenAPISpec = {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    [key: string]: any;
    security?: Array<Record<string, Security>>;
};

export type Security = {type: string; description: string};

export type OpenAPIOperation = {
    summary?: string;
    description?: string;
    operationId?: string;
    tags?: string[];
    servers?: Servers;
    parameters?: Parameters;
    responses?: {};
    requestBody?: {
        required?: boolean;
        description?: string;
        content: {[ContentType: string]: {schema: OpenJSONSchema}};
    };
    security?: Array<Record<string, Security>>;
    'x-navtitle': string[];
};

export type Info = {
    name: string;
    version: string;
    description?: string;
    terms?: string;
    license?: License;
    contact?: Contact;
};

export type License = {
    name: string;
    url?: string;
};

export type Contact = {
    name: string;
    sources: ContactSource[];
};

export type ContactSource = {type: ContactSourceType; url: string};

export type ContactSourceType = 'web' | 'email';

export type Tag = {
    id: string;
    name: string;
    description?: string;
    endpoints: Endpoints;
};

export type Endpoints = Endpoint[];

export type Endpoint = {
    id: string;
    operationId?: string;
    method: Method;
    path: string;
    tags: string[];
    summary?: string;
    description?: string;
    servers: Servers;
    parameters?: Parameters;
    responses?: Responses;
    requestBody?: Schema;
    security: Security[];
    noindex?: boolean;
    hidden?: boolean;
};

export type Specification = {
    tags: Map<string, Tag>;
    endpoints: Endpoints;
};

export const methods = [
    'get',
    'put',
    'post',
    'delete',
    'options',
    'head',
    'patch',
    'trace',
] as const;

export type Method = (typeof methods)[number];

export type Servers = Server[];

export type Server = {
    url: string;
    description?: string;
};

export type Parameters = Parameter[];

export type In = 'path' | 'query' | 'header' | 'cookie';

export type Primitive = string | number | boolean;

export type Parameter = {
    name: string;
    in: In;
    required: boolean;
    description?: string;
    example?: Primitive;
    default?: Primitive;
    schema: OpenJSONSchema;
};

export type Responses = Response[];

export type Response = {
    // response code validation omitted
    code: string;
    statusText: string;
    description: string;
    schemas?: Schemas;
};

export type Schemas = Schema[];

export type Schema = {
    type: string;
    schema: OpenJSONSchema;
};

export type Refs = {[typeName: string]: OpenJSONSchema};

export type JsType =
    | 'string'
    | 'number'
    | 'bigint'
    | 'boolean'
    | 'symbol'
    | 'undefined'
    | 'object'
    | 'function';
