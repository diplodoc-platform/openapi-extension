import type {Context} from '../index';
import type {LeadingPageSpecRenderMode, Specification, V3Info, V3Tag} from '../models';

import stringify from 'json-stringify-safe';
import {join} from 'path';

import {
    CONTACTS_SECTION_NAME,
    ENDPOINTS_SECTION_NAME,
    SPEC_RENDER_MODE_DEFAULT,
    SPEC_SECTION_NAME,
    SPEC_SECTION_TYPE,
    TAGS_SECTION_NAME,
} from '../constants';
import {mdPath, sectionName} from '../utils';

import {block, code, cut, link, list, mono, nolint, title} from './common';

export type MainParams = {
    data: unknown;
    info: V3Info;
    spec: Specification;
    leadingPageSpecRenderMode: LeadingPageSpecRenderMode;
};

export function main(params: MainParams, ctx: Context) {
    const {data, info, spec, leadingPageSpecRenderMode} = params;

    return block([
        nolint(),
        title(1)(info.name),
        info.version?.length && mono(`version: ${info.version}`),
        info.terms?.length && link('Terms of service', info.terms),
        info.license && link(info.license.name, info.license.url),
        info.description,
        contact(info.contact),
        sections(spec, ctx),
        specification(data, leadingPageSpecRenderMode),
    ]);
}

function contact(data: V3Info['contact']) {
    return (
        data?.name.length &&
        data?.sources.length &&
        block([title(2)(CONTACTS_SECTION_NAME), list(data.sources.map(contactSource(data)))])
    );
}

type V3InfoContact = Exclude<V3Info['contact'], undefined>;
type V3InfoContactSource = V3InfoContact['sources'][number];

function contactSource(data: V3InfoContact) {
    return (src: V3InfoContactSource) => link(`${data.name} ${src.type}`, src.url);
}

function sections({tags, endpoints}: Specification, ctx: Context) {
    const content = [];

    const taggedLinks = Array.from(tags)
        .map(([_, {name, id}]: [unknown, V3Tag]) => {
            const custom = ctx.tag(name);

            if (custom?.hidden) {
                return undefined;
            }

            const customId = custom?.alias || id;

            return link(name, join(customId, 'index.md'));
        })
        .filter(Boolean) as string[];

    if (taggedLinks.length) {
        content.push(title(2)(TAGS_SECTION_NAME), list(taggedLinks));
    }

    const untaggedLinks = endpoints.map((endpoint) =>
        link(sectionName(endpoint), mdPath(endpoint)),
    );
    if (untaggedLinks.length) {
        content.push(title(2)(ENDPOINTS_SECTION_NAME), list(untaggedLinks));
    }

    return block(content);
}

function specification(data: unknown, renderMode: LeadingPageSpecRenderMode) {
    return (
        renderMode === SPEC_RENDER_MODE_DEFAULT &&
        block([title(2)(SPEC_SECTION_NAME), cut(code(stringify(data, null, 4)), SPEC_SECTION_TYPE)])
    );
}
