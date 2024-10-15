import type {RefObject} from 'react';
import type {V3Security, V3SecurityOAuth2} from '../includer/models';
import type {Field, FormState} from './types';

import {V3SecurityApiKey} from "../includer/models";

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
    bodyType?: string,
    security?: V3Security[],
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
        for(const item of security) {
            const value = getTempValue(`${item.type}`);
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

const tempMap: Record<string, string> = {};

export function getTempValue(key: string): string | undefined {
    return tempMap[key];
}

export function setTempValue(key: string, value: string): void {
    tempMap[key] = value;
}

export function deleteTempValue(key: string): void {
    delete tempMap[key];
}

export function isV3SecurityApiKey(v3Security: V3Security): v3Security is V3SecurityApiKey {
    return v3Security.type === 'apiKey'
}

export function isV3SecurityOAuth2(v3Security: V3Security): v3Security is V3SecurityOAuth2 {
    return v3Security.type === 'oauth2';
}
