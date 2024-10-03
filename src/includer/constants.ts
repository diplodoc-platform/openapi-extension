import {OpenJSONSchema} from './models';

export enum LeadingPageMode {
    Section = 'section',
    Leaf = 'leaf',
}
export const EOL = '\n';
export const TAG_NAMES_FIELD = 'x-navtitle';
export const BLOCK = EOL.repeat(2);
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
export const HTML_COMMENTS_OPEN_DIRECTIVE = '<!--';
export const HTML_COMMENTS_CLOSE_DIRECTIVE = '-->';
export const DISABLE_LINTER_DIRECTIVE = 'markdownlint-disable-file';
export const SPEC_SECTION_NAME = 'Specification';
export const SPEC_SECTION_TYPE = 'Open API';
export const LEADING_PAGE_NAME_DEFAULT = 'Overview';
export const SPEC_RENDER_MODE_HIDDEN = 'hidden';
export const SPEC_RENDER_MODE_DEFAULT = 'inline';
export const DEPRECATED_ANNOTATION = 'Deprecated';
export const DEPRECATED_POPUP_TEXT =
    'No longer supported, please use an alternative and newer version.';
export const SUPPORTED_ENUM_TYPES = ['string', 'number'] as const;
export const PRIMITIVE_JSON6_SCHEMA_TYPES = new Set<OpenJSONSchema['type']>([
    'string',
    'boolean',
    'null',
    'number',
    'integer',
]);
export const SPEC_RENDER_MODES = new Set<string>([
    SPEC_RENDER_MODE_DEFAULT,
    SPEC_RENDER_MODE_HIDDEN,
]);
export const LEADING_PAGE_MODES = new Set<string>([LeadingPageMode.Leaf, LeadingPageMode.Section]);
