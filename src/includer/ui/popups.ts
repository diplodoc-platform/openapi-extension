import {DEPRECATED_ANNOTATION, DEPRECATED_POPUP_TEXT} from '../constants';

import {block} from './common';

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
