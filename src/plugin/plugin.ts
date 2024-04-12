import type Token from 'markdown-it/lib/token';
import type {MarkdownItPluginCb} from '@diplodoc/transform/lib/plugins/typings';
import {load} from 'js-yaml';

function isSandboxBlock(token: Token) {
    return token.type === 'fence' && token.info.match(/^\s*openapi-sandbox(\s*|$)/);
}

function applyTransforms({tokens}: {tokens: Token[]}) {
    const blocks = tokens.filter(isSandboxBlock);

    if (blocks.length) {
        blocks.forEach((token) => {
            token.type = 'openapi_sandbox_block';
            token.tag = 'div';
            token.attrSet('class', 'yfm-openapi-sandbox-js');
            token.attrSet('data-props', encodeURIComponent(JSON.stringify(load(token.content))));
            token.content = '';
        });
    }

    return true;
}

const openapiSandboxPlugin: MarkdownItPluginCb = (md) => {
    try {
        md.core.ruler.after('fence', 'openapi-sandbox', applyTransforms);
    } catch (e) {
        md.core.ruler.push('openapi-sandbox', applyTransforms);
    }
};

export function transform() {
    return openapiSandboxPlugin;
}
