import type {OpenAPIV3} from 'openapi-types';
import type {Dereference, In} from '../../../models';
import type {Renderer} from '../renderer';

import groupBy from 'lodash/groupBy';

import {
    COOKIES_SECTION_NAME,
    HEADERS_SECTION_NAME,
    PATH_PARAMETERS_SECTION_NAME,
    QUERY_PARAMETERS_SECTION_NAME,
} from '../../../constants';
import {block, title} from '../../common';

export function renderParameters(
    render: Renderer,
    params: Dereference<OpenAPIV3.ParameterObject>[] | undefined,
) {
    const sections = {
        path: PATH_PARAMETERS_SECTION_NAME,
        query: QUERY_PARAMETERS_SECTION_NAME,
        header: HEADERS_SECTION_NAME,
        cookie: COOKIES_SECTION_NAME,
    };

    const partitionedParameters = groupBy(params, (parameterSpec) => parameterSpec.in as In);

    const content = [];

    for (const [section, heading] of Object.entries(sections)) {
        const params = partitionedParameters[section as In] ?? [];
        const filteredParams = params.filter((param) => !param['x-hidden']);
        if (!filteredParams.length) {
            continue;
        }

        const schema = parametersToSchema(filteredParams);

        content.push(title(3)(heading), render.table(schema, 'write'), ...render.refs('write'));
    }

    return block(content);
}

function parametersToSchema(params: Dereference<OpenAPIV3.ParameterObject>[]) {
    return params.reduce(
        (acc, param) => {
            acc.properties = acc.properties || {};
            acc.properties[param.name] = {
                ...(param.schema || {}),
                description: merge('description', param, param.schema),
                example: merge('example', param, param.schema),
                // @ts-ignore
                default: valuable('default', param, param.schema),
                deprecated: Boolean(valuable('deprecated', param, param.schema)),
            };

            if (param.required) {
                acc.required = acc.required || [];
                acc.required.push(param.name);
            }

            return acc;
        },
        {type: 'object'} as Dereference<OpenAPIV3.SchemaObject>,
    );
}

function merge<K extends string>(prop: K, ...sources: (Partial<Record<K, string>> | undefined)[]) {
    return sources
        .map((source) => source && source[prop])
        .filter(Boolean)
        .join('\n');
}

function valuable<K extends string>(
    prop: K,
    ...sources: (Partial<Record<K, unknown>> | undefined)[]
) {
    for (const source of sources) {
        if (source && prop in source && source[prop] !== undefined) {
            return source[prop];
        }
    }

    return undefined;
}
