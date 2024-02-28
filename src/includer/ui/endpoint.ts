import stringify from 'json-stringify-safe';
import RefsService from '../services/refs';

import {
    COOKIES_SECTION_NAME,
    HEADERS_SECTION_NAME,
    INFO_TAB_NAME,
    PATH_PARAMETERS_SECTION_NAME,
    PRIMITIVE_JSON6_SCHEMA_TYPES,
    QUERY_PARAMETERS_SECTION_NAME,
    REQUEST_SECTION_NAME,
    RESPONSES_SECTION_NAME,
    SANDBOX_TAB_NAME,
} from '../constants';

import {
    TableRef,
    prepareSampleObject,
    prepareTableRowData,
    tableFromSchema,
} from '../traverse/tables';

import {
    Endpoint,
    OpenJSONSchema,
    Parameter,
    Parameters,
    Response,
    Responses,
    Schema,
    Security,
    Server,
} from '../models';

import {concatNewLine} from '../utils';

import {
    block,
    body,
    bold,
    code,
    cut,
    meta,
    method,
    openapiBlock,
    page,
    table,
    tableParameterName,
    tabs,
    title,
} from './common';

function endpoint(data: Endpoint, sandboxPlugin: {host?: string; tabName?: string} | undefined) {
    // try to remember, which tables we are already printed on page
    const pagePrintedRefs = new Set<string>();

    const contentWrapper = (content: string) => {
        return sandboxPlugin
            ? tabs({
                  [INFO_TAB_NAME]: content,
                  [sandboxPlugin?.tabName ?? SANDBOX_TAB_NAME]: sandbox({
                      params: data.parameters,
                      host: sandboxPlugin?.host,
                      path: data.path,
                      security: data.security,
                      requestBody: data.requestBody,
                      method: data.method,
                  }),
              })
            : content;
    };

    const endpointPage = block([
        title(1)(data.summary ?? data.id),
        contentWrapper(
            block([
                data.description?.length && body(data.description),
                request(data),
                parameters(pagePrintedRefs, data.parameters),
                openapiBody(pagePrintedRefs, data.requestBody),
                responses(pagePrintedRefs, data.responses),
            ]),
        ),
    ]);

    return block([
        meta([data.noindex && 'noIndex: true']),
        `<div class="${openapiBlock()}">`,
        page(endpointPage),
        '</div>',
    ]).trim();
}

function sandbox({
    params,
    host,
    path,
    security,
    requestBody,
    method,
}: {
    params?: Parameters;
    host?: string;
    path: string;
    security: Security[];
    requestBody?: Schema;
    method: string;
}) {
    const pathParams = params?.filter((param: Parameter) => param.in === 'path');
    const searchParams = params?.filter((param: Parameter) => param.in === 'query');
    const headers = params?.filter((param: Parameter) => param.in === 'header');
    let bodyStr: null | string = null;

    if (requestBody?.type === 'application/json' || requestBody?.type === 'multipart/form-data') {
        bodyStr = JSON.stringify(prepareSampleObject(requestBody?.schema ?? {}), null, 2);
    }

    const props = JSON.stringify({
        pathParams,
        searchParams,
        headers,
        body: bodyStr,
        schema: requestBody?.schema ?? {},
        bodyType: requestBody?.type,
        method,
        security,
        path: path,
        host: host ?? '',
    });

    return block(['{% openapi sandbox %}', props, '{% end openapi sandbox %}']);
}

function request(data: Endpoint) {
    const {path, method: type, servers} = data;
    let description: string | undefined;

    const url = block(servers.map(({url}) => code(url + '/' + path)));

    const requestTableRow = [method(type), `${url}`];

    if (servers.every((server: Server) => server.description)) {
        description = block(servers.map(({description}) => description));
    }

    const requestTable = block([
        '<div class="openapi__request__wrapper">',
        `<div class="openapi__request" style="--method: var(--dc-openapi-methods-${type})">`,
        ...requestTableRow,
        '</div>',
        '</div>',
    ]);

    const result = [title(2)(REQUEST_SECTION_NAME), requestTable];

    if (description) {
        result.push(`${description}{.openapi__request__description}`);
    }

    return block(result);
}

function parameters(pagePrintedRefs: Set<string>, params?: Parameters) {
    const sections = {
        path: PATH_PARAMETERS_SECTION_NAME,
        query: QUERY_PARAMETERS_SECTION_NAME,
        header: HEADERS_SECTION_NAME,
        cookie: COOKIES_SECTION_NAME,
    };
    const tables = [];
    for (const [inValue, heading] of Object.entries(sections)) {
        const inParams = params?.filter((param: Parameter) => param.in === inValue);
        if (inParams?.length) {
            const rows: string[][] = [];
            const tableRefs: TableRef[] = [];
            for (const param of inParams) {
                const {cells, ref} = parameterRow(param);
                rows.push(cells);
                if (ref) {
                    // there may be enums, which should be printed in separate tables
                    tableRefs.push(...ref);
                }
            }
            tables.push(title(3)(heading));
            tables.push(table([['Name', 'Type', 'Description'], ...rows]));
            tables.push(...printAllTables(pagePrintedRefs, tableRefs));
        }
    }
    return block(tables);
}

function parameterRow(param: Parameter): {cells: string[]; ref?: TableRef[]} {
    const row = prepareTableRowData(param.schema, param.name);
    let description = param.description ?? '';
    if (!row.ref && row.description.length) {
        // if row.ref present, row.description will be printed in separate table
        description = concatNewLine(description, row.description);
    }
    if (param.example !== undefined) {
        description = concatNewLine(description, `Example: \`${param.example}\``);
    }
    if (param.default !== undefined) {
        description = concatNewLine(description, `Default: \`${param.default}\``);
    }
    return {
        cells: [tableParameterName(param.name, param.required), row.type, description],
        ref: row.ref,
    };
}

function openapiBody(pagePrintedRefs: Set<string>, obj?: Schema) {
    if (!obj) {
        return '';
    }

    const {type = 'schema', schema} = obj;
    const sectionTitle = title(3)('Body');

    let result: any[] = [sectionTitle];

    if (isPrimitive(schema.type)) {
        result = [
            ...result,
            type,
            `${bold('Type:')} ${schema.type}`,
            schema.format && `${bold('Format:')} ${schema.format}`,
            schema.description && `${bold('Description:')} ${schema.description}`,
        ];

        return block(result);
    }

    const {content, tableRefs} = tableFromSchema(schema);
    const parsedSchema = prepareSampleObject(schema);

    result = [...result, cut(code(stringify(parsedSchema, null, 4), 'json'), type), content];

    result.push(...printAllTables(pagePrintedRefs, tableRefs));

    return block(result);
}

function isPrimitive(type: OpenJSONSchema['type']) {
    return PRIMITIVE_JSON6_SCHEMA_TYPES.has(type);
}

function printAllTables(pagePrintedRefs: Set<string>, tableRefs: TableRef[]): string[] {
    const result = [];

    while (tableRefs.length > 0) {
        const tableRef = tableRefs.shift();

        if (!tableRef) {
            continue;
        }

        if (pagePrintedRefs.has(tableRef)) {
            continue;
        }

        const schema = RefsService.get(tableRef);

        if (!schema) {
            continue;
        }

        const schemaTable = tableFromSchema(schema);
        const titleLevel = schema._runtime ? 4 : 3;

        result.push(
            block([
                title(titleLevel)(tableRef),
                schema._emptyDescription ? '' : schema.description,
                schemaTable.content,
            ]),
        );
        tableRefs.push(...schemaTable.tableRefs);
        pagePrintedRefs.add(tableRef);
    }
    return result;
}

function responses(visited: Set<string>, resps?: Responses) {
    return (
        resps?.length &&
        block([
            title(2)(RESPONSES_SECTION_NAME),
            block(resps.map((resp) => response(visited, resp))),
        ])
    );
}

function response(visited: Set<string>, resp: Response) {
    let header = resp.code;

    if (resp.statusText.length) {
        header += ` ${resp.statusText}`;
    }

    return block([
        `<div class="openapi__response__code__${resp.code}">`,
        title(2)(header),
        body(resp.description),
        resp.schemas?.length && block(resp.schemas.map((s) => openapiBody(visited, s))),
        '</div>',
    ]);
}

export {endpoint};

export default {endpoint};
