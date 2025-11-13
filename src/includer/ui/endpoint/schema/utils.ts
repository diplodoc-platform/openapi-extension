import type {JSONSchema, RefResolver, ResolvedRef} from './jsonSchema';

export function has<T, K extends keyof T>(
    object: T | null | undefined,
    key: K,
): object is T & Required<Pick<T, K>> {
    if (!object) {
        return false;
    }

    return Object.prototype.hasOwnProperty.call(object, key) && object[key] !== undefined;
}

const primitiveTypes = new Set(['string', 'number', 'integer', 'boolean']);

export function isPrimitiveType(
    schema: {type?: unknown} | null | undefined,
): schema is {type: 'string' | 'number' | 'integer' | 'boolean'} {
    return Boolean(schema && typeof schema.type === 'string' && primitiveTypes.has(schema.type));
}

export function blocks(parts: Array<string | undefined>): string {
    return parts.filter((part) => typeof part === 'string' && part.trim().length > 0).join('\n\n');
}

export function cut(title: string, body: string): string {
    return `{% cut "${title}" %}\n\n${body}\n\n{% endcut %}`;
}

export type TableRow = string | [string, string];

export interface TableOptions {
    classes?: string[];
}

export function table(rows: TableRow[], options?: TableOptions): string {
    const classAttr = options?.classes?.length
        ? ` {${options.classes.map((c) => `.${c}`).join(' ')}}`
        : '';
    return [`#|${classAttr}`, ...rows.map(formatRow), '|#'].join('\n');
}

function formatRow(row: TableRow): string {
    if (typeof row === 'string') {
        return row;
    }

    return `||\n\n${row
        .map((cell) => escapeTableText(cell))
        .join('\n{.table-cell}|\n')}\n{.table-cell}\n||`;
}

export function decorate(
    label: string,
    ...classNames: Array<string | false | null | undefined>
): string {
    const classes = classNames.filter(Boolean) as string[];
    if (classes.length === 0) {
        return label;
    }

    const stripped = label.replace(/^_+|_+$/g, '');
    const unique = Array.from(
        new Set(['json-schema-reset', ...classes.join(' ').split(' ').filter(Boolean)]),
    );
    const classSuffix = unique.map((className) => `.${className}`).join(' ');

    return `_${stripped}_{${classSuffix}}`;
}

interface LabeledResolvedRef extends ResolvedRef {
    label: string;
}

export function resolveRef(
    schema: JSONSchema,
    resolver: RefResolver,
): LabeledResolvedRef | undefined {
    if (!schema.$ref) {
        return undefined;
    }

    const refData = resolver(schema.$ref);
    if (!refData || !refData.href || !refData.schema) {
        return undefined;
    }

    const label = refData.label || schema.$ref.split('/').pop() || schema.$ref;

    return {
        label,
        href: refData.href,
        schema: refData.schema,
    };
}

interface RefVisitInfo {
    refId?: string;
}

export function traverseSchemaRefs(
    schema: JSONSchema | undefined,
    resolver: RefResolver,
    visitor: (current: JSONSchema, info: RefVisitInfo) => void,
): void {
    if (!schema) {
        return;
    }

    const stack: Array<{node: JSONSchema; refId?: string}> = [{node: schema}];
    const seenRefs = new Set<string>();

    while (stack.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const {node, refId} = stack.pop()!;
        visitor(node, {refId});

        if (!node.$ref) {
            continue;
        }

        if (seenRefs.has(node.$ref)) {
            continue;
        }

        seenRefs.add(node.$ref);

        const resolved = resolveRef(node, resolver);
        if (resolved) {
            stack.push({node: resolved.schema, refId: node.$ref});
        }
    }
}

export function extractConditionDescription(ifSchema: JSONSchema): string {
    // Try to extract from properties with const/enum
    if (ifSchema.properties) {
        const conditions = Object.entries(ifSchema.properties).map(([key, value]) => {
            if (value.const !== undefined) {
                return `${key} = ${JSON.stringify(value.const)}`;
            }
            if (value.enum && value.enum.length > 0) {
                const values = value.enum.map((v) => JSON.stringify(v)).join(', ');
                return `${key} in [${values}]`;
            }
            if (value.type) {
                return `${key} is ${value.type}`;
            }
            return `${key} is defined`;
        });

        if (conditions.length > 0) {
            return conditions.join(' and ');
        }
    }

    // Try to extract from required
    if (ifSchema.required && ifSchema.required.length > 0) {
        const fields = ifSchema.required.join(', ');
        return `${fields} ${ifSchema.required.length === 1 ? 'is' : 'are'} required`;
    }

    // Try to extract from type
    if (ifSchema.type) {
        return `type is ${ifSchema.type}`;
    }

    // Fallback
    return 'condition matches';
}
