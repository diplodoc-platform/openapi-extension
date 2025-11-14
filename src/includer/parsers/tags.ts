import type {OpenAPIV3} from 'openapi-types';
import type {Dereference} from '../models';
import type {V3Endpoint} from './paths';

import slugify from 'slugify';

import {TAG_NAMES_FIELD} from '../constants';

import {visitPaths} from './utils';

export type V3Tag = {
    id: string;
    name: string;
    description?: string;
    endpoints: V3Endpoint[];
};

export function tags(spec: Dereference<OpenAPIV3.Document>): Map<string, V3Tag> {
    const {tags, paths} = spec;

    const parsed = new Map();

    if (!tags?.length) {
        return parsed;
    }

    for (const tag of tags) {
        if (!tag?.name?.length) {
            continue;
        }

        const id = slugify(tag.name);

        parsed.set(id, {...tag, id, endpoints: [] as V3Endpoint[]});
    }

    type VisiterOutput = {tags: string[]; titles: string[]};

    const tagsTitles = visitPaths(paths, (params): VisiterOutput | null => {
        const {endpoint} = params;

        const endpointTags = endpoint.tags;
        // @ts-ignore
        const titles = endpoint[TAG_NAMES_FIELD];

        if (!endpointTags?.length || !titles?.length || endpointTags.length !== titles.length) {
            return null;
        }

        return {tags: endpointTags, titles};
    }).filter(Boolean) as VisiterOutput[];

    for (const {tags: visiterTags, titles} of tagsTitles) {
        for (let i = 0; i < titles.length; i++) {
            const key = slugify(visiterTags[i]);

            parsed.set(key, {...parsed.get(key), name: titles[i]});
        }
    }

    return parsed;
}
