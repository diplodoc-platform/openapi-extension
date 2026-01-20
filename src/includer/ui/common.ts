import type {OpenAPIV3} from 'openapi-types';
import type {Dereference} from '../models';

import slugify from 'slugify';

import {DEPRECATED_ANNOTATION, DEPRECATED_POPUP_TEXT, SYNTAX_HIGHLIGHT_LIMIT} from '../constants';

export const EOL = '\n';

export const BLOCK = EOL.repeat(2);

export function openapi(content: string) {
    return block([`<div class="openapi">`, content, '</div>']);
}

export function meta(content: (string | boolean | undefined)[]) {
    const entries = content.filter(Boolean);

    if (!entries.length) {
        return [];
    }

    return ['---', ...content.filter(Boolean), '---'].join(EOL);
}

export function list(items: string[]) {
    return items.map((item) => `- ${item}`).join(EOL) + EOL;
}

export function link(text: string, src: string | undefined, className?: string) {
    if (!src) {
        return '';
    }

    let md = `[${text}](${src})`;

    if (className) {
        md += `{.${className}}`;
    }

    return md;
}

export function title(depth: 1 | 2 | 3 | 4 | 5 | 6) {
    const markup = '#'.repeat(depth) + ' ';
    return (content?: string, anchor?: string) => {
        anchor = (anchor || '').trim();
        anchor = anchor ? ' {' + anchor + '}' : '';
        return content?.length ? `${markup}${content}${anchor}` : '';
    };
}

export function mono(text: string) {
    return `##${text}##`;
}

export function bold(text: string) {
    return `**${text}**`;
}

export function code(text: string, type = 'text', translate = false) {
    const appliedType =
        type && (text.length <= SYNTAX_HIGHLIGHT_LIMIT || type === 'openapi-sandbox')
            ? type
            : 'text';
    return ['```' + appliedType + ` ${translate ? '' : 'translate=no'}`, text, '```'].join(EOL);
}

export function method(text: string, path: string, server: Dereference<OpenAPIV3.ServerObject>) {
    const method = `${text.toUpperCase()} {.openapi__method}`;
    const link = code(server.url + '/' + path);

    return [method, link].join(EOL);
}

export function cut(text: string, heading = '', attrs: string | string[] = '') {
    if (Array.isArray(attrs)) {
        attrs = attrs.join(' ');
    }

    return block([`{% cut "${heading}" %}${attrs ? `{${attrs}}` : ''}`, text, '{% endcut %}']);
}

export function block(elements: unknown[]) {
    return elements
        .filter((part) => typeof part === 'string' && part.trim().length > 0)
        .join(BLOCK);
}

export function nolint() {
    return `<!-- markdownlint-disable-file -->`;
}

export function entity(content: string) {
    return block(['<div class="openapi-entity">', content, '</div>']);
}

export function tabs(tabsObj: Record<string, string>) {
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

export function anchor(ref: string, name?: string) {
    return link(name || ref, `#${slugify(ref).toLowerCase()}`);
}

const content: Record<string, string> = {
    [DEPRECATED_ANNOTATION]: DEPRECATED_POPUP_TEXT,
};

export function deprecated({compact = false} = {}) {
    const classes = ['.openapi-deprecated', compact ? '.openapi-deprecated-compact' : ''].filter(
        Boolean,
    );

    if (compact) {
        return `_[ ](*${DEPRECATED_ANNOTATION})_{${classes.join(' ')}}`;
    }

    return `[${DEPRECATED_ANNOTATION}](*${DEPRECATED_ANNOTATION}){${classes.join(' ')}}`;
}

export function terms(list: (keyof typeof content)[]) {
    return block(
        Object.entries(content)
            .filter(([name]) => list.includes(name))
            .map(([name, content]) => `[*${name}]: ${content}`),
    );
}
