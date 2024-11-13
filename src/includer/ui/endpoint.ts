import stringify from 'json-stringify-safe';
import {dump} from 'js-yaml';
import groupBy from 'lodash/groupBy';

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
    In,
    OpenJSONSchema,
    V3Endpoint,
    V3Parameter,
    V3Parameters,
    V3Response,
    V3Responses,
    V3Schema,
    V3Security,
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
import {prepareRenderableParameterList} from './presentationUtils/prepareRenderableParameterList';
import {popups} from './popups';

function endpoint(data: V3Endpoint, sandboxPlugin: {host?: string; tabName?: string} | undefined) {
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
        data.deprecated && popups.deprecated(),
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
        popups.collect(),
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
    params?: V3Parameters;
    host?: string;
    path: string;
    security: V3Security[];
    requestBody?: V3Schema;
    method: string;
}) {
    const pathParams = params?.filter((param: V3Parameter) => param.in === 'path');
    const searchParams = params?.filter((param: V3Parameter) => param.in === 'query');
    const headers = params?.filter((param: V3Parameter) => param.in === 'header');
    let bodyStr: null | string = null;

    if (requestBody?.type === 'application/json' || requestBody?.type === 'multipart/form-data') {
        bodyStr = JSON.stringify(prepareSampleObject(requestBody?.schema ?? {}), null, 2);
    }

    const props = dump({
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

    return block(['```openapi-sandbox\n' + props + '\n```']);
}

function request(data: V3Endpoint) {
    const {path, method: type, servers} = data;

    const requests = servers.map((server, index) => {
        const args = [`--method: var(--dc-openapi-methods-${type})`];

        if (index !== servers.length) {
            args.push('margin-bottom: 12px');
        }

        return block([
            `<div class="openapi__request__wrapper" style="${args.join(';')}">`,
            `<div class="openapi__request">`,
            method(type, path, server),
            '</div>',
            server.description || '',
            '</div>',
        ]);
    });

    const result = [
        title(2)(REQUEST_SECTION_NAME),
        '<div class="openapi__requests">',
        ...requests,
        '</div>',
    ];

    return block(result);
}

function getParameterSourceTableContents(parameterList: readonly V3Parameter[]) {
    const rowsAndRefs = parameterList.map((param) => parameterRow(param));

    const additionalRefs = rowsAndRefs
        .flatMap(({ref}) => ref)
        .filter((maybeRef): maybeRef is string => typeof maybeRef !== 'undefined');

    const contentRows = rowsAndRefs.map(({cells}) => cells);

    return {additionalRefs, contentRows};
}

function parameters(pagePrintedRefs: Set<string>, params?: V3Parameters) {
    const sections = {
        path: PATH_PARAMETERS_SECTION_NAME,
        query: QUERY_PARAMETERS_SECTION_NAME,
        header: HEADERS_SECTION_NAME,
        cookie: COOKIES_SECTION_NAME,
    };

    const partitionedParameters = groupBy(params, (parameterSpec) => parameterSpec.in) as Record<
        In,
        V3Parameter[] | undefined
    >;

    const content = Object.keys(sections)
        .map(
            (parameterSource) =>
                [
                    parameterSource as In,
                    partitionedParameters[parameterSource as In] ?? [],
                ] as const,
        )
        .map(
            ([parameterSource, parameterList]) =>
                [parameterSource, prepareRenderableParameterList(parameterList)] as const,
        )
        .filter(([, parameterList]) => parameterList.length)
        .reduce<string[]>((contentAccumulator, [parameterSource, parameterList]) => {
            const {contentRows, additionalRefs} = getParameterSourceTableContents(parameterList);

            const tableHeading = sections[parameterSource];

            contentAccumulator.push(
                title(3)(tableHeading),
                table([['Name', 'Description'], ...contentRows]),
                ...printAllTables(pagePrintedRefs, additionalRefs),
            );

            return contentAccumulator;
        }, []);

    return block(content);
}

function parameterRow(param: V3Parameter): {cells: string[]; ref?: TableRef[]} {
    const row = prepareTableRowData(param.schema, param.name);
    let description = param.description ?? '';
    if (!row.ref?.length && row.description.length) {
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
        cells: [
            tableParameterName(param.name, param),
            block([`${bold('Type:')} ${row.type}`, description]),
        ],
        ref: row.ref,
    };
}

function openapiBody(pagePrintedRefs: Set<string>, obj?: V3Schema) {
    if (!obj) {
        return '';
    }

    const {type = 'schema', schema} = obj;
    const sectionTitle = title(3)('Body');

    let result: (string | null)[] = [sectionTitle];

    if (isPrimitive(schema.type)) {
        result = [
            ...result,
            type,
            `${bold('Type:')} ${schema.type}`,
            schema.format ? `${bold('Format:')} ${schema.format}` : null,
            schema.description ? `${bold('Description:')} ${schema.description}` : null,
        ];

        return block(result);
    }

    const {content, tableRefs} = tableFromSchema(schema);
    const parsedSchema = prepareSampleObject(schema);

    result = [
        '<div class="openapi-entity">',
        ...result,
        cut(code(stringify(parsedSchema, null, 4), 'json'), type),
        content,
        '</div>',
    ];

    result.push(...printAllTables(pagePrintedRefs, tableRefs));

    return block(result);
}

function isPrimitive(type: OpenJSONSchema['type']) {
    return PRIMITIVE_JSON6_SCHEMA_TYPES.has(type);
}

function entity(ref: string, schema: OpenJSONSchema) {
    const schemaTable = tableFromSchema(schema);
    const titleLevel = schema._runtime ? 4 : 3;

    const markup = block([
        '<div class="openapi-entity">',
        title(titleLevel)(ref),
        schema._emptyDescription ? '' : schema.description,
        schemaTable.content,
        '</div>',
    ]);

    return {markup, refs: schemaTable.tableRefs};
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

        pagePrintedRefs.add(tableRef);

        const {refs, markup} = entity(tableRef, schema);

        result.push(markup);
        tableRefs.push(...refs);
    }
    return result;
}

function responses(visited: Set<string>, resps?: V3Responses) {
    return (
        resps?.length &&
        block([
            title(2)(RESPONSES_SECTION_NAME),
            block(resps.map((resp) => response(visited, resp))),
        ])
    );
}

function response(visited: Set<string>, resp: V3Response) {
    let header = resp.code;

    if (resp.statusText.length) {
        header += ` ${resp.statusText}`;
    }

    const isAllSchemasDeprecated =
        resp.schemas?.length && resp.schemas?.every(({schema}) => schema.deprecated);

    return block([
        `<div class="openapi__response__code__${resp.code}">`,
        title(2)(header),
        isAllSchemasDeprecated && popups.deprecated(),
        body(resp.description),
        resp.schemas?.length && block(resp.schemas.map((s) => openapiBody(visited, s))),
        '</div>',
    ]);
}

export {endpoint};

export default {endpoint};
