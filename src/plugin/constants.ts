// eslint-disable-next-line import/no-extraneous-dependencies
import block from 'bem-cn-lite';

export const Text = {
    BUTTON_SUBMIT: 'Send',

    HEADER_PARAMS_SECTION_TITLE: 'Header parameters',
    QUERY_PARAMS_SECTION_TITLE: 'Query parameters',
    PATH_PARAMS_SECTION_TITLE: 'Path parameters',

    BODY_INPUT_LABEL: 'Body',

    RESPONSE_ERROR_SECTION_TITLE: 'Response error',
    RESPONSE_SECTION_TITLE: 'Response',

    URL_VALUE_LABEL: 'Request URL',
    RESPONSE_STATUS_LABEL: 'Status',
    RESPONSE_BODY_LABEL: 'Body',

    RESPONSE_FILE_LABEL: 'File from response',
};

export const MapperNames = {
    header: 'Header',
    query: 'Query',
} as const;

export const yfmSandbox = block('yfm-sandbox');

export const possibleReasonsFailToFetch = [
    'CORS',
    'Network Failure',
    'URL scheme must be "http" or "https" for CORS request.',
];
