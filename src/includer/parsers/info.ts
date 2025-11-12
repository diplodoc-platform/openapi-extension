import type {OpenAPIV3} from 'openapi-types';
import type {Dereference} from '../models';

export type V3License = {
    name: string;
    url?: string;
};

type ContactSourceType = 'web' | 'email';

type ContactSource = {
    type: ContactSourceType;
    url: string;
};

export type V3Contact = {
    name: string;
    sources: ContactSource[];
};

export type V3Info = {
    name: string;
    version: string;
    description?: string;
    terms?: string;
    license?: V3License;
    contact?: V3Contact;
};

export function info(spec: Dereference<OpenAPIV3.Document>): V3Info {
    const {
        info: {title, description, version, termsOfService, license, contact},
    } = spec;

    const parsed: V3Info = {
        name: title,
        version: version,
    };

    if (termsOfService) {
        parsed.terms = new URL(termsOfService).href;
    }

    if (description) {
        parsed.description = description;
    }

    if (license) {
        parsed.license = {
            name: license.name,
        };

        if (license.url) {
            parsed.license.url = new URL(license.url).href;
        }
    }

    if (contact && (contact.url || contact.email)) {
        parsed.contact = {
            name: contact.name || '',
            sources: [
                contact.url && {type: 'web', url: new URL(contact.url).href},
                contact.email && {
                    type: 'email',
                    url: new URL('mailto:' + contact.email).href,
                },
            ].filter(Boolean) as ContactSource[],
        };
    }

    return parsed;
}
