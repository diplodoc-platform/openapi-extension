export enum LeadingPageMode {
    Section = 'section',
    Leaf = 'leaf',
}
export const ENDPOINT_METHODS = [
    'get',
    'put',
    'post',
    'delete',
    'options',
    'head',
    'patch',
    'trace',
] as const;
export const TAG_NAMES_FIELD = 'x-navtitle';
export const INFO_TAB_NAME = 'Info';
export const SANDBOX_TAB_NAME = 'Sandbox';
export const CONTACTS_SECTION_NAME = 'Contacts';
export const TAGS_SECTION_NAME = 'Sections';
export const ENDPOINTS_SECTION_NAME = 'Endpoints';
export const REQUEST_SECTION_NAME = 'Request';
export const PATH_PARAMETERS_SECTION_NAME = 'Path parameters';
export const HEADERS_SECTION_NAME = 'Headers';
export const QUERY_PARAMETERS_SECTION_NAME = 'Query parameters';
export const COOKIES_SECTION_NAME = 'Cookies';
export const RESPONSES_SECTION_NAME = 'Responses';
export const SPEC_SECTION_NAME = 'Specification';
export const SPEC_SECTION_TYPE = 'Open API';
export const LEADING_PAGE_NAME_DEFAULT = 'Overview';
export const SPEC_RENDER_MODE_HIDDEN = 'hidden';
export const SPEC_RENDER_MODE_DEFAULT = 'inline';
export const SPEC_RENDER_MODE_LINK = 'link';
export const DEPRECATED_ANNOTATION = 'Deprecated';
export const DEPRECATED_POPUP_TEXT =
    'No longer supported, please use an alternative and newer version.';
export const SPEC_RENDER_MODES = new Set<string>([
    SPEC_RENDER_MODE_DEFAULT,
    SPEC_RENDER_MODE_HIDDEN,
    SPEC_RENDER_MODE_LINK,
]);
export const LEADING_PAGE_MODES = new Set<string>([LeadingPageMode.Leaf, LeadingPageMode.Section]);
export const SYNTAX_HIGHLIGHT_LIMIT = 10000;

/**
 * Suffix of the standalone OpenAPI spec companion emitted next to the root leading page.
 * The actual file name is derived from the includer input spec name
 * (`petstore.yaml` -> `petstore.openapi.json`), see {@link companionFilename}.
 */
export const SPEC_COMPANION_SUFFIX = '.openapi.json';

/** Link text used on the leading page when the spec is rendered as a `link`. */
export const SPEC_LINK_TEXT = 'Open API specification';

/**
 * Single source of truth for the default `ai.openapiCompanions` mode.
 * `'md'` -> emit the companion only in md2md builds.
 */
export const DEFAULT_OPENAPI_COMPANIONS_MODE = 'md' as const;

/** Default `maxOpenapiIncludeInlineSize`: specs larger than this switch from `inline` to `link`. */
export const DEFAULT_MAX_OPENAPI_INCLUDE_INLINE_SIZE = 100 * 1024; // 100 KiB

/** Hard cap for `maxOpenapiIncludeInlineSize`: values above this are clamped down. */
export const MAX_OPENAPI_INCLUDE_INLINE_SIZE_LIMIT = 1024 * 1024; // 1 MiB
