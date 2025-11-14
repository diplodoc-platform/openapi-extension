import type {V3Endpoint, V3Tag} from '../models';

import {ENDPOINTS_SECTION_NAME} from '../constants';

import {block, link, list, nolint, title} from './common';

export function section(tag: V3Tag) {
    return block([title(1)(tag.name), nolint(), tag.description, endpoints(tag.endpoints)]);
}

function endpoints(data?: V3Endpoint[]) {
    const visibleEndpoints = data?.filter((ep) => !ep.hidden);
    const linkMap = ({id, summary, deprecated}: V3Endpoint) => {
        let mdLink = link(summary ?? id, id + '.md', deprecated ? 'openapi-deprecated-link' : '');

        if (deprecated) {
            mdLink += ` <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="currentColor" fill-rule="evenodd" d="M11.323 12.383a5.5 5.5 0 0 1-7.706-7.706zm1.06-1.06L4.677 3.617a5.5 5.5 0 0 1 7.706 7.706M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0" clip-rule="evenodd"/></svg>`;
        }

        return mdLink;
    };

    return (
        visibleEndpoints?.length &&
        block([title(2)(ENDPOINTS_SECTION_NAME), list(visibleEndpoints.map(linkMap))])
    );
}
