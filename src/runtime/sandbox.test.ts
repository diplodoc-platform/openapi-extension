import type {ReactNode} from 'react';

import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {Sandbox} from './sandbox';

vi.mock('@gravity-ui/uikit', async () => {
    const {createElement} = await import('react');

    return {
        Button: () => null,
        Text: ({children}: {children?: ReactNode}) => createElement('span', null, children),
        TextInput: ({name, value}: {name: string; value: string}) =>
            createElement('input', {name, value, readOnly: true}),
    };
});

vi.mock('./components', async () => {
    const {createElement} = await import('react');

    return {
        BodyFormData: () => null,
        BodyJson: () => null,
        Column: ({children}: {children?: ReactNode}) => createElement('div', null, children),
        Params: () => null,
        Result: () => null,
        Security: () => null,
    };
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('Sandbox custom host field', () => {
    it('renders the configured host field when custom host is enabled', () => {
        vi.stubGlobal('window', {
            location: {pathname: '/docs/guide', search: ''},
            __DATA__: {},
            localStorage: {getItem: () => null},
        } as unknown as Window);

        const markup = renderToStaticMarkup(
            createElement(Sandbox, {
                path: 'items',
                host: 'https://api.example',
                customHost: true,
                method: 'get',
                projectName: 'project',
                security: [],
            }),
        );

        expect(markup).toContain('Host');
        expect(markup).toContain('https://api.example');
        expect(markup).toContain('name="host"');
    });
});
