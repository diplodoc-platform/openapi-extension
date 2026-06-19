import type {OpenAPIV3} from 'openapi-types';
import type {Specification, V3Endpoint} from './models';

import {ENDPOINT_METHODS} from './constants';
import {trimSlashes} from './utils';

/**
 * Builds the standalone OpenAPI specification document that backs a generated section.
 *
 * The result is a valid OpenAPI document derived from the partially dereferenced input
 * (schemas are kept as `$ref`s, so recursive schemas stay acyclic and serializable),
 * narrowed down to exactly what the section actually exposes:
 *  - only operations that survived the includer `filter` are kept (taken from {@link Specification});
 *  - everything marked with `x-hidden: true` (parameters, schema properties, whole schemas) is removed;
 *  - file-qualified self-`$ref`s are localized back to in-document fragments (`#/components/...`);
 *  - `components.schemas` that become unreachable after the above are pruned.
 *
 * It is intentionally derived from the processed document rather than the original source file,
 * so a consumer cannot recover endpoints/fields that were deliberately filtered out.
 */
export function buildCompanionDocument(
    document: OpenAPIV3.Document,
    spec: Specification,
): OpenAPIV3.Document {
    const included = collectIncludedOperations(spec);
    const withFilteredPaths = filterPaths(document, included);
    const withoutHidden = stripXHidden(
        withFilteredPaths as unknown as JsonValue,
    ) as unknown as OpenAPIV3.Document;

    localizeRefs(withoutHidden as unknown as JsonValue);

    return pruneSchemas(withoutHidden);
}

export function serializeCompanionDocument(document: OpenAPIV3.Document): string {
    return JSON.stringify(document);
}

function operationKey(method: string, path: string): string {
    return `${method.toLowerCase()} ${trimSlashes(path)}`;
}

function collectIncludedOperations(spec: Specification): Set<string> {
    const keys = new Set<string>();

    const addAll = (endpoints: V3Endpoint[]) => {
        for (const endpoint of endpoints) {
            keys.add(operationKey(endpoint.method, endpoint.path));
        }
    };

    addAll(spec.endpoints);
    spec.tags.forEach((tag) => addAll(tag.endpoints));

    return keys;
}

/**
 * Returns a deep copy of the document whose `paths` contain only the included operations.
 * Path items that end up without any operation are dropped entirely.
 */
function filterPaths(document: OpenAPIV3.Document, included: Set<string>): OpenAPIV3.Document {
    const clone = structuredClone(document);
    const paths = clone.paths ?? {};
    const nextPaths: OpenAPIV3.PathsObject = {};

    for (const [path, pathItem] of Object.entries(paths)) {
        if (!pathItem) {
            continue;
        }

        let hasOperation = false;

        for (const method of ENDPOINT_METHODS) {
            const operation = (pathItem as OpenAPIV3.PathItemObject)[method];
            if (!operation) {
                continue;
            }

            if (included.has(operationKey(method, path))) {
                hasOperation = true;
            } else {
                delete (pathItem as OpenAPIV3.PathItemObject)[method];
            }
        }

        if (hasOperation) {
            nextPaths[path] = pathItem;
        }
    }

    clone.paths = nextPaths;

    return clone;
}

type JsonObject = {[key: string]: JsonValue | undefined};
type JsonValue = null | boolean | number | string | JsonValue[] | JsonObject;

function isHidden(value: unknown): boolean {
    return (
        typeof value === 'object' &&
        value !== null &&
        (value as {[key: string]: unknown})['x-hidden'] === true
    );
}

/**
 * Recursively removes everything annotated with `x-hidden: true`:
 *  - array items that are hidden objects are filtered out (e.g. parameters);
 *  - object entries whose value is a hidden object are deleted (e.g. schema properties);
 *  - the `x-hidden` annotation itself is stripped from the output.
 *
 * Cycle-safe: already visited containers are returned as-is to avoid infinite recursion.
 */
export function stripXHidden(input: JsonValue, seen: WeakSet<object> = new WeakSet()): JsonValue {
    if (Array.isArray(input)) {
        if (seen.has(input)) {
            return input;
        }
        seen.add(input);

        return input.filter((item) => !isHidden(item)).map((item) => stripXHidden(item, seen));
    }

    if (typeof input === 'object' && input !== null) {
        if (seen.has(input)) {
            return input;
        }
        seen.add(input);

        const result: JsonObject = {};

        for (const [key, value] of Object.entries(input)) {
            if (key === 'x-hidden') {
                continue;
            }
            if (value === undefined || isHidden(value)) {
                continue;
            }
            result[key] = stripXHidden(value, seen);
        }

        return result;
    }

    return input;
}

function collectRefs(input: JsonValue, refs: Set<string>, seen: WeakSet<object> = new WeakSet()) {
    if (input === null || typeof input !== 'object') {
        return;
    }

    if (seen.has(input)) {
        return;
    }
    seen.add(input);

    if (Array.isArray(input)) {
        input.forEach((item) => collectRefs(item, refs, seen));
        return;
    }

    for (const [key, value] of Object.entries(input)) {
        if (key === '$ref' && typeof value === 'string') {
            refs.add(value);
        } else if (value !== undefined) {
            collectRefs(value, refs, seen);
        }
    }
}

/**
 * Rewrites file-qualified `$ref`s into in-document fragment refs:
 * `/abs/path/spec.yaml#/components/schemas/Foo` -> `#/components/schemas/Foo`.
 *
 * The partially dereferenced input can carry self-references as `<file>#<pointer>`, where `<file>`
 * is the absolute path of the source spec. The companion is a single self-contained document, so
 * those prefixes are both meaningless to consumers and environment-dependent (they break snapshot
 * stability and, worse, prevent {@link pruneSchemas} from recognizing reachable schemas).
 * Pure external refs without a fragment (`./other.yaml`) are left untouched. Mutates in place.
 */
function localizeRefs(input: JsonValue, seen: WeakSet<object> = new WeakSet()): void {
    if (input === null || typeof input !== 'object') {
        return;
    }

    if (seen.has(input)) {
        return;
    }
    seen.add(input);

    if (Array.isArray(input)) {
        input.forEach((item) => localizeRefs(item, seen));
        return;
    }

    for (const [key, value] of Object.entries(input)) {
        if (key === '$ref' && typeof value === 'string') {
            const hashIndex = value.indexOf('#');
            if (hashIndex > 0) {
                input[key] = value.slice(hashIndex);
            }
        } else if (value !== undefined) {
            localizeRefs(value, seen);
        }
    }
}

const SCHEMA_REF = /^#\/components\/schemas\/(.+)$/;

/**
 * Drops `components.schemas` entries that are not reachable from the rest of the document
 * (transitively through `$ref`s). Other component groups (parameters, securitySchemes, ...)
 * are left intact because they are not always referenced via `$ref` (e.g. security schemes
 * are referenced by name).
 */
function pruneSchemas(document: OpenAPIV3.Document): OpenAPIV3.Document {
    const components = document.components as
        | {schemas?: {[name: string]: JsonValue}; [group: string]: unknown}
        | undefined;
    const schemas = components?.schemas;

    if (!components || !schemas) {
        return document;
    }

    // Roots: refs found everywhere except inside the schema definitions themselves.
    const scanTarget: JsonValue = {
        ...(document as unknown as JsonObject),
        components: {...(components as unknown as JsonObject), schemas: undefined},
    };
    const roots = new Set<string>();
    collectRefs(scanTarget, roots);

    const reachable = new Set<string>();
    const queue = [...roots];

    while (queue.length) {
        const ref = queue.pop() as string;
        const match = SCHEMA_REF.exec(ref);
        if (!match) {
            continue;
        }

        const name = match[1];
        if (reachable.has(name) || !(name in schemas)) {
            continue;
        }

        reachable.add(name);

        const childRefs = new Set<string>();
        collectRefs(schemas[name], childRefs);
        childRefs.forEach((childRef) => queue.push(childRef));
    }

    const nextSchemas: {[name: string]: JsonValue} = {};
    for (const [name, value] of Object.entries(schemas)) {
        if (reachable.has(name)) {
            nextSchemas[name] = value;
        }
    }

    (components as {schemas?: unknown}).schemas = nextSchemas;

    return document;
}
