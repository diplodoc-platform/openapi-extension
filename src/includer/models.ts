import {JSONSchema6, JSONSchema6Definition} from 'json-schema';

import {
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
    pathParams?: Parameters;
    searchParams?: Parameters;
    headers?: Parameters;
    body?: string;
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
    deprecated?: boolean;
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

    // vendor extensions
    'x-hidden'?: boolean;
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
    allowAnonymousObjects?: boolean;
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
