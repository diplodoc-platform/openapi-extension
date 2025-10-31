import type {TitleDepth, V3Server} from '../models';

import slugify from 'slugify';
import bem from 'bem-cn-lite';

import {
    BLOCK,
    DISABLE_LINTER_DIRECTIVE,
    EOL,
    HTML_COMMENTS_CLOSE_DIRECTIVE,
    HTML_COMMENTS_OPEN_DIRECTIVE,
} from '../constants';

import {popups} from './popups';

const openapiBlock = bem('openapi');

function meta(content: (string | boolean | undefined)[]) {
    const entries = content.filter(Boolean);

    if (!entries.length) {
        return [];
    }

    return EOL + ['---', ...content.filter(Boolean), '---'].join(EOL) + EOL;
}

function list(items: string[]) {
    return items.map((item) => `- ${item}`).join(EOL) + EOL;
}

function link(text: string, src: string, className?: string) {
    let md = `[${text}](${src})`;

    if (className) {
        md += `{.${className}}`;
    }

    return md;
}

function title(depth: TitleDepth) {
    return (content?: string) => (content?.length ? '#'.repeat(depth) + ` ${content}` : '');
}

function body(text?: string) {
    return text?.length && text;
}

function mono(text: string) {
    return `##${text}##`;
}

function bold(text: string) {
    return `**${text}**`;
}

function code(text: string, type = 'text', translate = false) {
    const appliedType = type && text.length <= 2000 ? type : 'text';
    return (
        EOL +
        ['```' + appliedType + ` ${translate ? '' : 'translate=no'}`, text, '```'].join(EOL) +
        EOL
    );
}

function method(text: string, path: string, server: V3Server) {
    let result = `${text.toUpperCase()} {.openapi__method}`;

    result += ` ${code(server.url + '/' + path)}` + EOL;

    return result;
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
function table(data: any[][]) {
    const sep = '__masked(&#124;)';

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const colgen = (col: any) => {
        const content = Array.isArray(col) ? table(col) : escapeTableColContent(` ${col} `);

        return `${EOL}${content}${EOL}`;
    };
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const rowgen = (row: any) => `${sep}${sep}${row.map(colgen).join(sep)}${sep}${sep}`;

    return `#${sep}${block(data.map(rowgen))}${sep}#{.openapi-table}`;
}

function cut(text: string, heading = '', attrs = '') {
    return (
        block([`{% cut "${heading}" %}${attrs ? `{${attrs}}` : ''}`, text, '{% endcut %}']) + EOL
    );
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
function block(elements: any[]) {
    return elements.filter(Boolean).join(BLOCK);
}

// https://stackoverflow.com/a/49834158
function escapeTableColContent(cellContent: string) {
    return cellContent.replace(/\|/gi, '<code>&#124;</code>');
}

function page(content: string) {
    return `${content}\n${HTML_COMMENTS_OPEN_DIRECTIVE} ${DISABLE_LINTER_DIRECTIVE} ${HTML_COMMENTS_CLOSE_DIRECTIVE}`;
}

function tabs(tabsObj: Record<string, string>) {
    return block([
        '{% list tabs %}',
        Object.entries(tabsObj)
            .map(
                ([tab, value]) => `- ${tab}

  ${value.replace(/\n/g, '\n  ')}
        `,
            )
            .join('\n\n'),
        '{% endlist %}\n',
    ]);
}

function anchor(ref: string, name?: string) {
    return link(name || ref, `#${slugify(ref).toLowerCase()}`);
}

type ParameterNameProps = Partial<{
    required: boolean;
    deprecated: boolean;
}>;
function tableParameterName(key: string, {required, deprecated}: ParameterNameProps) {
    let tableName = key;

    if (required) {
        tableName += `<span class="${openapiBlock('required')}">*</span>`;
    }

    if (deprecated) {
        tableName += popups.deprecated({compact: true});
    }

    return tableName + ' {.openapi-table-parameter-name}';
}

export {
    meta,
    list,
    link,
    title,
    body,
    mono,
    bold,
    table,
    code,
    cut,
    block,
    page,
    tabs,
    anchor,
    method,
    tableParameterName,
    openapiBlock,
};

export default {
    meta,
    list,
    link,
    title,
    body,
    mono,
    bold,
    table,
    code,
    cut,
    block,
    tabs,
    anchor,
    method,
    tableParameterName,
    openapiBlock,
};
