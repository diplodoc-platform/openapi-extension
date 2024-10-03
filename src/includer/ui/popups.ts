import {DEPRECATED_ANNOTATION, DEPRECATED_POPUP_TEXT, EOL} from '../constants';

const content: Record<string, string> = {
    [DEPRECATED_ANNOTATION]: DEPRECATED_POPUP_TEXT,
};

const register = (key: string, value: string) => {
    content[key] = value;
};

const render = (key: string, innerHTML: string, classList: string[] = []) => {
    if (!key || !innerHTML) {
        return '';
    }

    const id = (Math.random() * 1e8).toString(16);
    return `<div class="yfm yfm-term_title ${classList.join(' ')}" term-key=":${key}" role="button" aria-describedby=":${key}_element" tabindex="0" id="${id}">${innerHTML}</div>`;
};

const collect = () => {
    return Object.entries(content).reduce((acc, [name, content]) => {
        return acc + EOL.repeat(2) + `[*${name}]: ${content}`;
    }, '');
};

const deprecated = ({compact = false} = {}) => {
    const markup = compact ? '&#10680;' : DEPRECATED_ANNOTATION; // ⦸

    return render(DEPRECATED_ANNOTATION, markup, ['openapi-deprecated', compact ? 'compact' : '']);
};

export const popups = {
    register,
    render,
    collect,
    deprecated,
};
