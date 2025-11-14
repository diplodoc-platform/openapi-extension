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

export type TableRow = string | [string, string];

export interface TableOptions {
    classes?: string[];
}

export function table(rows: TableRow[], options?: TableOptions): string {
    const classAttr = options?.classes?.length
        ? `{${options.classes.map((c) => `.${c}`).join(' ')}}`
        : '';
    return maskTablePipes([`#|`, ...rows.map(formatRow), '|#'].join('\n') + classAttr);
}

function formatRow(row: TableRow): string {
    if (typeof row === 'string') {
        return row;
    }

    return `||\n\n${row
        .map((cell) => escapeTableText(cell))
        .join('\n{.table-cell}|\n')}\n{.table-cell}\n||`;
}

function escapeTableText(value: string): string {
    return value.replace(/\|/g, '&#124;');
}

function maskTablePipes(value: string): string {
    return value.replace(/\|/g, '__masked(&#124;)');
}

export function unmaskTableContent(value: string): string {
    return value.replace(/__masked\(&#124;\)/g, '|');
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
    const unique = Array.from(new Set(['json-schema-reset', ...classes.filter(Boolean)]));
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
