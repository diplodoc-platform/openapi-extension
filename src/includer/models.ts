import type {OpenAPIV3} from 'openapi-types';
import type {
    ENDPOINT_METHODS,
    LeadingPageMode,
    SPEC_RENDER_MODE_DEFAULT,
    SPEC_RENDER_MODE_HIDDEN,
} from './constants';
import type {V3Endpoint, V3Info, V3Response, V3Schema, V3Tag} from './parsers';

export {V3Info, V3Endpoint, V3Response, V3Schema, V3Tag};

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

export type YfmPreset = Record<string, string>;

export interface YfmTocItem {
    name?: string;
    href?: string;
    items?: YfmTocItem[];
    hidden?: boolean;
    deprecated?: boolean;
}

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
    security?: OpenAPIV3.SecuritySchemeObject[];
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
    flows: {};
    'x-inline'?: boolean;
};

export type V3SecurityType = OpenAPIV3.SecuritySchemeObject['type'];

export type Specification = {
    tags: Map<string, V3Tag>;
    endpoints: V3Endpoint[];
};

export type Method = (typeof ENDPOINT_METHODS)[number];

export type In = 'path' | 'query' | 'header' | 'cookie';

export type Primitive = string | number | boolean;

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
    read(file: string): Promise<string>;
};
