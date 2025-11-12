import type {OpenAPIV3} from 'openapi-types';
import type {Dereference} from '../models';

import {ENDPOINT_METHODS} from '../constants';

export type VisiterParams = {
    path: string;
    method: string;
    endpoint: Dereference<OpenAPIV3.OperationObject>;
};

export function visitPaths<T>(
    paths: OpenAPIV3.PathsObject,
    visiter: (params: VisiterParams) => T,
): T[] {
    const results: T[] = [];

    for (const [path, items] of Object.entries(paths)) {
        for (const method of ENDPOINT_METHODS) {
            const endpoint = (items as OpenAPIV3.PathItemObject)[
                method
            ] as Dereference<OpenAPIV3.OperationObject>;
            if (endpoint) {
                results.push(visiter({path, method, endpoint}));
            }
        }
    }

    return results;
}
