import type {OpenAPIV3} from 'openapi-types';

import {dirname, join} from 'node:path';
import {readFile} from 'node:fs/promises';
import {load} from 'js-yaml';

export const $ref = Symbol('$ref');

export class RefsService {
    private _files: Record<string, unknown> = {};

    private _root: string;

    constructor(spec: object, root: string) {
        this._files[root] = spec;
        this._root = root;
    }

    get(key: string) {
        const [path, anchor] = key.split('#');
        let schema = this._files[path || this._root];

        if (!schema) {
            throw new Error(`Unknown ref target: ${key}`);
        }

        const parts = anchor ? anchor.split('/').slice(1) : [];
        while (parts.length) {
            const part = parts.shift() as string;
            schema = (schema as Record<string, unknown>)[part] as object;
        }

        return schema as OpenAPIV3.SchemaObject | undefined;
    }

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

    private async load(refId: string, root: string) {
        const [path, anchor] = refId.split('#');
        const file = path ? join(dirname(root), path) : root;
        const key = file.replace(this._root, '');

        if (!path || path === root) {
            return `${key}#${anchor}`;
        }

        if (!this._files[key]) {
            this._files[key] = load(await readFile(file, 'utf8'));
            await this.resolve(this._files[key] as object, file);
        }

        return `${key}#${anchor}`;
    }
}
