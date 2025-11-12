import {DEPRECATED_ANNOTATION, DEPRECATED_POPUP_TEXT} from '../constants';

import {block} from './common';

const content: Record<string, string> = {
    [DEPRECATED_ANNOTATION]: DEPRECATED_POPUP_TEXT,
};

export function deprecated({compact = false} = {}) {
    const markup = compact ? '&#10680;' : DEPRECATED_ANNOTATION; // ⦸
    const classes = ['.openapi-deprecated', compact ? '.openapi-deprecated-compact' : ''].filter(
        Boolean,
    );

    return `[${markup}](*${content[DEPRECATED_ANNOTATION]}){${classes.join(' ')}`;
}

export function terms(list: (keyof typeof content)[]) {
    return block(
        Object.entries(content)
            .filter(([name]) => list.includes(name))
            .map(([name, content]) => `[*${name}]: ${content}`),
    );
}
