import type {OpenAPIV3} from 'openapi-types';
import type {RefObject} from 'react';
import type {
    V3SecurityApiKey,
    V3SecurityOAuthImplicit,
    V3SecurityOAuthInline,
    V3SecurityType,
} from '../includer/models';
import type {Field, FormState} from './types';

export const merge = <T, R>(items: T[], iterator: (item: T) => Record<string, R> | undefined) => {
    return items.reduce((acc, item) => Object.assign(acc, iterator(item)), {} as Record<string, R>);
};

export const prepareBody = ({
    bodyType,
    bodyJson,
    bodyFormData,
}: {
    bodyType?: string;
    bodyJson: string | undefined;
    bodyFormData: FormData | undefined;
}) => {
    switch (bodyType) {
        case 'application/json':
            return {body: bodyJson};
        case 'multipart/form-data':
            return {body: bodyFormData};

        default:
            return {};
    }
};

export const prepareRequest = (
    urlTemplate: string,
    {search, headers, path, bodyJson, bodyFormData}: FormState,
    projectName: string,
    bodyType?: string,
    security?: OpenAPIV3.SecuritySchemeObject[],
) => {
    const preparedHeaders = {...headers};
    const requestUrl = Object.entries(path).reduce((acc, [key, value]) => {
        return acc.replace(`{${key}}`, encodeURIComponent(value));
    }, urlTemplate);

    const searchParams = new URLSearchParams();
    Object.entries(search).forEach(([key, value]) => {
        searchParams.append(key, value);
    });

    if (security) {
        for (const item of security) {
            const value = getAuthByType(projectName, item.type).value;
            if (isV3SecurityApiKey(item) && value) {
                if (item.in === 'header') {
                    preparedHeaders[item.name] = value;
                } else if (item.in === 'query') {
                    searchParams.set(item.name, value);
                }
            }

            if (isV3SecurityOAuth2(item) && value) {
                preparedHeaders.Authorization = `Bearer ${value}`;
            }
        }
    }

    const searchString = searchParams.toString();
    const url = requestUrl + (searchString ? '?' + searchString : '');

    return {
        url,
        headers:
            bodyType === 'application/json'
                ? {
                      ...preparedHeaders,
                      'Content-Type': 'application/json',
                  }
                : preparedHeaders,
        // TODO: match request types (www-form-url-encoded should be handled too)
        body: prepareBody({bodyFormData, bodyJson, bodyType}),
    };
};

export function collectErrors(fields: Record<string, RefObject<Field>>) {
    const errors = Object.keys(fields).reduce(
        (acc, key) => {
            const field = fields[key].current;

            if (!field) {
                return acc;
            }

            const error = field.validate();

            if (error) {
                acc[key] = error;
            }

            return acc;
        },
        {} as Record<string, unknown>,
    );

    if (!Object.keys(errors).length) {
        return null;
    }

    return errors;
}

export function collectValues<F extends Record<string, RefObject<Field>>>(
    fields: F,
): Record<keyof F, unknown> {
    return Object.keys(fields).reduce(
        (acc, key: keyof F) => {
            const field = fields[key].current;

            if (!field) {
                return acc;
            }

            acc[key] = field.value();

            return acc;
        },
        {} as Record<keyof F, unknown>,
    );
}

export function getSelectedAuth(prefix: string): {
    type: V3SecurityType | null;
    value: string | null;
} {
    const type = sessionStorage.getItem(`${prefix}_type`) as V3SecurityType;
    return {
        type,
        value: sessionStorage.getItem(`${prefix}_value`),
    };
}
export function getAuthByType(
    prefix: string,
    type: string,
): {type: string | null; value: string | null} {
    const typeFromStorage = sessionStorage.getItem(`${prefix}_type`);

    return {
        type: typeFromStorage,
        value: type === typeFromStorage ? sessionStorage.getItem(`${prefix}_value`) : null,
    };
}

export function setAuth(prefix: string, {type, value}: {type: string; value: string}) {
    sessionStorage.setItem(`${prefix}_type`, type);
    sessionStorage.setItem(`${prefix}_value`, value);
}

export function isV3SecurityApiKey(
    v3Security: OpenAPIV3.SecuritySchemeObject,
): v3Security is V3SecurityApiKey {
    return v3Security.type === 'apiKey';
}

export function isV3SecurityOAuth2(
    v3Security: OpenAPIV3.SecuritySchemeObject,
): v3Security is OpenAPIV3.OAuth2SecurityScheme {
    return v3Security.type === 'oauth2';
}

export function isV3SecurityOAuthInline(
    v3Security: OpenAPIV3.SecuritySchemeObject,
): v3Security is V3SecurityOAuthInline {
    return (
        isV3SecurityOAuth2(v3Security) &&
        Boolean('x-inline' in v3Security && v3Security['x-inline'])
    );
}

export function isV3SecurityOAuthImplicit(
    v3Security: OpenAPIV3.SecuritySchemeObject,
): v3Security is V3SecurityOAuthImplicit {
    return (
        isV3SecurityOAuth2(v3Security) &&
        Boolean('flows' in v3Security && 'implicit' in v3Security.flows)
    );
}
