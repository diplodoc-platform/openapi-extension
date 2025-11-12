import type {OpenAPIV3} from 'openapi-types';
import type {Run} from '../models';

import {dirname, join} from 'node:path';
import {load} from 'js-yaml';

export const $ref = Symbol('$ref');

/**
 * Utility that keeps track of OpenAPI references during includer rendering.
 * - Holds already loaded files and their parsed specs.
 * - Resolves relative file references and normalizes `$ref` values to the includer root.
 * - Produces `$defs` blocks for schemas so they can be reused without duplication.
 */
export class RefsService {
    private _run: Run;

    private _files: Record<string, unknown> = {};

    private _root: string;

    /**
     * @param run – execution context used to read files from disk.
     * @param spec – root OpenAPI document that has already been parsed.
     * @param root – absolute path to the original spec file; used as base for rebasing `$ref`s.
     */
    constructor(run: Run, spec: object, root: string) {
        this._run = run;
        this._files[root] = spec;
        this._root = root;
    }

    /**
     * Returns schema for a `$ref` identifier. Supports nested anchors (`#/components/...`).
     *
     * @param key - canonical `$ref` string (possibly with file path and anchor).
     */
    get(key: string) {
        const [path, anchor] = key.split('#');
        let schema = this._files[path || this._root];

        const parts = anchor ? anchor.split('/').slice(1) : [];
        while (parts.length) {
            const part = parts.shift() as string;
            schema = (schema as Record<string, unknown>)[part] as object;
        }

        return schema as OpenAPIV3.SchemaObject;
    }

    /**
     * Walks through a schema/document, resolves `$ref`s and rebases them to the includer root.
     * Loads external files lazily and stores them in `_files`.
     *
     * @param value - schema node to start traversal from.
     * @param root - current absolute path used for resolving relative references.
     */
    async resolve(value: object, root?: string) {
        const visited = new Set();
        const visit = async (item: unknown, root: string) => {
            if (!item || typeof item !== 'object') {
                return;
            }

            if (visited.has(item)) {
                return;
            }
            visited.add(item);

            if ($ref in item) {
                const [path] = (item[$ref] as string).split('#');
                root = join(dirname(root), path);
            }

            if (Array.isArray(item)) {
                for (const value of item) {
                    await visit(value, root);
                }
            } else {
                if ('$ref' in item && typeof item.$ref === 'string') {
                    item.$ref = await this.load(item.$ref, root);
                }

                for (const value of Object.values(item)) {
                    await visit(value, root);
                }
            }
        };

        await visit(value, root || this._root);
    }

    /**
     * Creates a copy of the schema where inline `$ref`s are turned into anchors inside `$defs`.
     * Helps to deduplicate schemas when rendering tables/examples.
     *
     * @param schema - schema (or `$ref`) that should be normalized.
     * @returns tuple with normalized schema and collected `$defs`.
     */
    merge(
        schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
    ): [OpenAPIV3.SchemaObject, Record<string, OpenAPIV3.SchemaObject>] {
        const defs: Record<string, object> = {};
        const resolve = <T>(schema: T, processing?: Set<string>, skipped?: Set<string>): T => {
            processing = new Set([...(processing || [])]);
            skipped = new Set([...(skipped || [])]);

            while (this.isEmptyReference(schema)) {
                const refId = schema.$ref;

                if (skipped.has(refId)) {
                    break;
                }
                skipped.add(refId);

                schema = this.get(schema.$ref) as T;
            }

            if (this.isReference(schema)) {
                const refId = schema.$ref;
                const anchor = '#/$defs' + refId.split('#').pop();

                if (defs[refId]) {
                    return {
                        ...schema,
                        $ref: anchor,
                    } as T;
                }

                if (processing.has(refId)) {
                    defs[refId] = {$ref: anchor};
                    return {
                        ...schema,
                        $ref: anchor,
                    } as T;
                }

                processing.add(refId);
                defs[refId] = resolve(this.get(refId), processing, skipped);
                processing.delete(refId);

                return {
                    ...schema,
                    $ref: anchor,
                } as T;
            }

            let result: T = schema;

            if (Array.isArray(schema)) {
                result = schema.map((value) => resolve(value, processing, skipped)) as T;
            } else if (schema && typeof schema === 'object') {
                result = Object.entries(schema).reduce(
                    (acc, [key, value]) => {
                        acc[key] = resolve(value, processing, skipped);
                        return acc;
                    },
                    {} as Record<string, unknown>,
                ) as T;
            }

            return result;
        };

        return [resolve(schema) as OpenAPIV3.SchemaObject, defs];
    }

    /**
     * Type guard that checks if a value looks like a `$ref` object.
     */
    isReference(schema: unknown): schema is OpenAPIV3.ReferenceObject & Record<string, unknown> {
        return Boolean(schema && typeof schema === 'object' && '$ref' in schema);
    }

    /**
     * Checks whether `$ref` object contains only `$ref` field (no other props).
     */
    isEmptyReference(schema: unknown): schema is OpenAPIV3.ReferenceObject {
        return this.isReference(schema) && Object.keys(schema).length === 1;
    }

    /**
     * Loads (and caches) file referenced by `$ref`, verifies that requested anchor exists
     * and returns canonical `$ref` that is relative to includer root.
     *
     * @param refId - raw `$ref` value (may contain relative path).
     * @param root - file path that contains current `$ref` (used for resolving relatives).
     */
    private async load(refId: string, root: string) {
        const [path, anchor] = refId.split('#');
        const file = path ? join(dirname(root), path) : root;
        const key = file.replace(this._root, '');

        if (!path || path === root) {
            assertAccessible(root, key, this._files[key] as Record<string, unknown>, anchor);
            return `${key}#${anchor}`;
        }

        if (!this._files[key]) {
            this._files[key] = load(await this._run.read(file));
            await this.resolve(this._files[key] as object, file);
            assertAccessible(root, key, this._files[key] as Record<string, unknown>, anchor);
        }

        return `${key}#${anchor}`;
    }
}

function assertAccessible(root: string, file: string, json: Record<string, unknown>, key: string) {
    const path = key.split('/').slice(1);

    while (path.length && json) {
        const prop = path.shift() as string;
        if (prop in json) {
            json = json[prop] as Record<string, unknown>;
        } else {
            throw new Error(`Unknown ref target: ${file}#${key} from ${root}`);
        }
    }

    return json;
}
