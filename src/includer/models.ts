import type {JSONSchema6, JSONSchema6Definition} from 'json-schema';
import type {
    LeadingPageMode,
    SPEC_RENDER_MODE_DEFAULT,
    SPEC_RENDER_MODE_HIDDEN,
    SUPPORTED_ENUM_TYPES,
} from './constants';

export type VarsPreset = 'internal' | 'external';

export type YfmPreset = Record<string, string>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Metadata = Record<string, any>;

export enum IncludeMode {
    ROOT_MERGE = 'root_merge',
    MERGE = 'merge',
    LINK = 'link',
}

export interface Filter {
    when?: boolean | string;
    [key: string]: unknown;
}

export interface TextItem extends Filter {
    text: string | string[];
}

export type TextItems = string | (TextItem | string)[];

export interface YfmToc extends Filter {
    name: string;
    href: string;
    items: YfmToc[];
    stage?: Stage;
    base?: string;
    title?: TextItems;
    include?: YfmTocInclude;
    id?: string;
    singlePage?: boolean;
    hidden?: boolean;
    deprecated?: boolean;
}

export interface YfmTocItem extends Filter {
    name: string;
    href?: string;
    items?: YfmTocItem[];
    include?: YfmTocInclude;
    id?: string;
}

export interface YfmTocInclude {
    repo: string;
    path: string;
    mode?: IncludeMode;
    includers?: YfmTocIncluders;
}

export type YfmTocIncluders = YfmTocIncluder[];

export type YfmTocIncluder = {
    name: 'openapi';
    // arbitrary includer parameters
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
} & Record<string, unknown>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Includer<FnParams = any> = {
    name: 'openapi';
    includerFunction: IncluderFunction<FnParams>;
};

export type IncluderFunction<PassedParams> = (
    args: IncluderFunctionParams<PassedParams>,
) => Promise<void>;

export type IncluderFunctionParams<PassedParams> = {
    /** item that contains include that uses includer */
    item: YfmToc;
    /** base read directory path */
    readBasePath: string;
    /** base write directory path */
    writeBasePath: string;
    /** toc with includer path */
    tocPath: string;
    vars: YfmPreset;
    /** arbitrary includer parameters */
    passedParams: PassedParams;
    index: number;
};

export const titleDepths = [1, 2, 3, 4, 5, 6] as const;

export type TitleDepth = (typeof titleDepths)[number];

export type SandboxProps = {
    path: string;
    host?: string;
    method: Method;
    pathParams?: V3Parameters;
    searchParams?: V3Parameters;
    headers?: V3Parameters;
    body?: string;
    bodyType?: string;
    schema?: OpenJSONSchema;
    security?: V3Security[];
    projectName: string;
};

export type OpenAPISpec = {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    [key: string]: any;
    security?: Array<Record<string, V3Security>>;
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

export type OpenAPIOperation = {
    summary?: string;
    description?: string;
    operationId?: string;
    deprecated?: boolean;
    tags?: string[];
    servers?: V3Servers;
    parameters?: V3Parameters;
    responses?: {};
    requestBody?: {
        required?: boolean;
        description?: string;
        content: {[ContentType: string]: {schema: OpenJSONSchema}};
    };
    security?: Array<Record<string, V3Security>>;
    'x-navtitle': string[];
};

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
    method: Method;
    path: string;
    tags: string[];
    summary?: string;
    description?: string;
    servers: V3Servers;
    parameters?: V3Parameters;
    responses?: V3Responses;
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

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type V3Parameters = V3Parameter[];

export type In = 'path' | 'query' | 'header' | 'cookie';

export type Primitive = string | number | boolean;

export type V3Parameter = {
    name: string;
    in: In;
    required: boolean;
    description?: string;
    example?: Primitive;
    default?: Primitive;
    schema: OpenJSONSchema;

    readOnly?: boolean;
    writeOnly?: boolean;
    // vendor extensions
    'x-hidden'?: boolean;
};

export type V3Responses = V3Response[];

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type V3Response = {
    // response code validation omitted
    code: string;
    statusText: string;
    description: string;
    schemas?: V3Schemas;
};

export type V3Schemas = V3Schema[];

export type V3Schema = {
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

export type LeadingPageSpecRenderMode =
    | typeof SPEC_RENDER_MODE_DEFAULT
    | typeof SPEC_RENDER_MODE_HIDDEN;

export type SupportedEnumType = (typeof SUPPORTED_ENUM_TYPES)[number];

export enum Stage {
    NEW = 'new',
    PREVIEW = 'preview',
    TECH_PREVIEW = 'tech-preview',
    SKIP = 'skip',
}

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

export type OpenJSONSchema = JSONSchema6 & {
    _runtime?: true;
    _emptyDescription?: true;
    example?: unknown;
    deprecated?: boolean;
    properties?: {
        [key: string]: JSONSchema6Definition & {
            'x-hidden'?: boolean;
        };
    };
};
export type OpenJSONSchemaDefinition = OpenJSONSchema | boolean;

export type FoundRefType = {
    ref: string;
};
export type BaseJSONSchemaType = Exclude<OpenJSONSchema['type'], undefined>;
export type JSONSchemaUnionType = {
    ref?: string;
    /* Not oneOf because of collision with OpenJSONSchema['oneOf'] */
    unionOf: JSONSchemaType[];
};
export type JSONSchemaType = BaseJSONSchemaType | JSONSchemaUnionType | FoundRefType;

export type Run = {
    input: string;
    vars: {
        for(path: string): YfmPreset;
    };
};
