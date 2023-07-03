import {OpenapiMD} from '../typings';

export function clear(md: OpenapiMD): OpenapiMD {
    const lines = md.split('\n').filter(Boolean);
    const withoutDiv = lines.splice(1, lines.length - 1).join('\n');

    return withoutDiv;
}

const TEXT_REGEX = /[a-z]|[A-Z]/i;

export function extractText(target: string): string {
    return target.split('').filter((char) => char.match(TEXT_REGEX)).join('');
}
