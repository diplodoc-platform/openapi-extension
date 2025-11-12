import type {OpenAPIV3} from 'openapi-types';
import type {LeadingPageMode, SPEC_RENDER_MODE_DEFAULT, SPEC_RENDER_MODE_HIDDEN} from './constants';

export type Dereference<T> = T extends OpenAPIV3.ReferenceObject
    ? never
    : T extends object
      ? T extends OpenAPIV3.ReferenceObject
          ? never
          : // eslint-disable-next-line
            T extends any[]
            ? DereferenceArray<T[number]>
            : DereferenceObject<T>
      : T;

type DereferenceArray<T> = Array<Dereference<T>>;

type DereferenceObject<T extends object> = {
    [K in keyof T]: Dereference<T[K]>;
};

export type TableRef = string;

export type YfmPreset = Record<string, string>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Metadata = Record<string, any>;

export interface Filter {
    when?: boolean | string;
    [key: string]: unknown;
}

export interface TextItem extends Filter {
    text: string | string[];
}

export type TextItems = string | (TextItem | string)[];

export interface YfmTocItem extends Filter {
    name: string;
    href?: string;
    items?: YfmTocItem[];
    hidden?: boolean;
    deprecated?: boolean;
}

export const titleDepths = [1, 2, 3, 4, 5, 6] as const;

export type TitleDepth = (typeof titleDepths)[number];

export type SandboxProps = {
    path: string;
    host?: string;
    method: Method;
    pathParams?: Dereference<OpenAPIV3.ParameterObject>[];
    searchParams?: Dereference<OpenAPIV3.ParameterObject>[];
    headers?: Dereference<OpenAPIV3.ParameterObject>[];
    body?: string;
    bodyType?: string;
    schema?: Dereference<OpenAPIV3.SchemaObject>;
    security?: V3Security[];
    projectName: string;
};

export type V3SecurityApiKey = {
    type: 'apiKey';
    description: string;
    name: string;
    in: 'query' | 'header';
};

export type V3SecurityOAuthImplicit = {
    type: 'oauth2';
    description: string;
    flows: {
        implicit: {
            authorizationUrl: string;
            scopes: Record<string, string>;
        };
    };
};

export type V3SecurityOAuthInline = {
    type: 'oauth2';
    description: string;
    'x-inline'?: boolean;
};

export type V3SecurityOAuth2 = V3SecurityOAuthImplicit | V3SecurityOAuthInline;

export type V3Security = V3SecurityApiKey | V3SecurityOAuth2 | {type: string; description: string};

export type V3SecurityType = V3Security['type'];

export type V3Info = {
    name: string;
    version: string;
    description?: string;
    terms?: string;
    license?: V3License;
    contact?: V3Contact;
};

export type V3License = {
    name: string;
    url?: string;
};

export type V3Contact = {
    name: string;
    sources: ContactSource[];
};

export type ContactSource = {type: ContactSourceType; url: string};

export type ContactSourceType = 'web' | 'email';

export type V3Tag = {
    id: string;
    name: string;
    description?: string;
    endpoints: V3Endpoints;
};

export type V3Endpoints = V3Endpoint[];

export type V3Endpoint = {
    id: string;
    operationId?: string;
    method: string;
    path: string;
    tags: string[];
    summary?: string;
    description?: string;
    servers: V3Servers;
    parameters: Dereference<OpenAPIV3.ParameterObject>[];
    responses: V3Responses;
    requestBody?: V3Schema;
    security: V3Security[];
    noindex?: boolean;
    hidden?: boolean;
    deprecated?: boolean;
};

export type Specification = {
    tags: Map<string, V3Tag>;
    endpoints: V3Endpoints;
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

export type V3Servers = V3Server[];

export type V3Server = {
    url: string;
    description?: string;
};

export type In = 'path' | 'query' | 'header' | 'cookie';

export type Primitive = string | number | boolean;

export type V3Responses = V3Response[];

// eslint-disable-next-line @typescript-eslint/no-redeclare
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

export type Refs = {[typeName: string]: OpenAPIV3.SchemaObject};

export type LeadingPageSpecRenderMode =
    | typeof SPEC_RENDER_MODE_DEFAULT
    | typeof SPEC_RENDER_MODE_HIDDEN;

export type LeadingPageParams = {
    name?: string;
    mode?: LeadingPageMode;
    spec?: {
        renderMode: LeadingPageSpecRenderMode;
    };
};

export type OpenApiFilter = {
    endpoint?: string;
    tag?: string;
};

export type CustomTag = {
    hidden?: boolean;
    name?: string;
    path?: string;
    alias?: string;
};

export type OpenApiIncluderParams = {
    input: string;
    leadingPage?: LeadingPageParams;
    filter?: OpenApiFilter;
    noindex?: OpenApiFilter;
    hidden?: OpenApiFilter;
    sandbox?: {
        tabName?: string;
        host?: string;
    };
    tags?: {
        [tag: string]: CustomTag | undefined;
        /** top-level leading page */
        __root__?: CustomTag;
    };
};

export type Run = {
    input: string;
    vars: {
        for(path: string): YfmPreset;
    };
};
