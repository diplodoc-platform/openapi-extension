import type {Context} from '../../index';
import type {V3Endpoint} from '../../models';

import {describe, expect, it} from 'vitest';

import {endpoint} from './index';

function createContext(vars: Readonly<Record<string, string>>): Context {
    return {
        vars,
        params: {input: ''},
        tag: () => undefined,
        relative: (path) => path,
        refs: {
            merge: (schema: object) => [schema, {}],
        } as unknown as Context['refs'],
    };
}

function createEndpoint(): V3Endpoint {
    return {
        id: 'get-items',
        method: 'get',
        path: 'items',
        tags: [],
        servers: [],
        parameters: [],
        responses: [],
        security: [],
    };
}

describe('endpoint sandbox host', () => {
    it('interpolates own variables and leaves inherited or unknown variables unchanged', () => {
        const vars = Object.assign(Object.create({inherited: 'https://inherited.example'}), {
            apiHost: 'https://api.example',
        }) as Record<string, string>;

        const page = endpoint(
            createEndpoint(),
            {host: '{{ apiHost }}/{{ inherited }}/{{ missing }}', customHost: true},
            createContext(vars),
        );

        expect(page).toContain('https://api.example/{{ inherited }}/{{ missing }}');
        expect(page).toContain('customHost: true');
    });

    it('preserves a host without placeholders and supports a missing host', () => {
        const context = createContext({});
        const configuredHost = endpoint(createEndpoint(), {host: 'https://api.example'}, context);
        const missingHost = endpoint(createEndpoint(), {}, context);

        expect(configuredHost).toContain('https://api.example');
        expect(missingHost).toContain("host: ''");
    });
});
